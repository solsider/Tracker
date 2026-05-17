import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsRepository } from '../projects/projects.repository';
import { CreateBranchDto, CreateCommitDto, CreatePRDto } from './git.dto';

// Matches PROJ-123 style keys in commit messages / branch names
const ISSUE_KEY_RE = /([A-Z]{2,10})-(\d+)/g;

@Injectable()
export class GitService {
  constructor(
    private prisma: PrismaService,
    private projectsRepository: ProjectsRepository,
  ) {}

  async getLinksForIssue(projectId: string, issueNumber: number, userId: string) {
    await this.assertAccess(projectId, userId);
    const issue = await this.findIssue(projectId, issueNumber);
    const [branches, commits, prs] = await Promise.all([
      this.prisma.gitBranch.findMany({ where: { issueId: issue.id }, orderBy: { createdAt: 'desc' } }),
      this.prisma.gitCommit.findMany({ where: { issueId: issue.id }, orderBy: { committedAt: 'desc' } }),
      this.prisma.gitPullRequest.findMany({ where: { issueId: issue.id }, orderBy: { createdAt: 'desc' } }),
    ]);
    return { branches, commits, pullRequests: prs };
  }

  async addBranch(projectId: string, issueNumber: number, dto: CreateBranchDto, userId: string) {
    await this.assertAccess(projectId, userId);
    const issue = await this.findIssue(projectId, issueNumber);
    return this.prisma.gitBranch.upsert({
      where: { issueId_name: { issueId: issue.id, name: dto.name } },
      create: { name: dto.name, url: dto.url, issueId: issue.id },
      update: { url: dto.url },
    });
  }

  async addCommit(projectId: string, issueNumber: number, dto: CreateCommitDto, userId: string) {
    await this.assertAccess(projectId, userId);
    const issue = await this.findIssue(projectId, issueNumber);
    return this.prisma.gitCommit.upsert({
      where: { issueId_sha: { issueId: issue.id, sha: dto.sha } },
      create: {
        sha: dto.sha, message: dto.message, url: dto.url,
        authorName: dto.authorName, issueId: issue.id,
        committedAt: dto.committedAt ? new Date(dto.committedAt) : undefined,
      },
      update: { message: dto.message, url: dto.url },
    });
  }

  async addPR(projectId: string, issueNumber: number, dto: CreatePRDto, userId: string) {
    await this.assertAccess(projectId, userId);
    const issue = await this.findIssue(projectId, issueNumber);
    return this.prisma.gitPullRequest.upsert({
      where: { issueId_url: { issueId: issue.id, url: dto.url } },
      create: {
        number: dto.number_,
        title: dto.title,
        url: dto.url,
        state: dto.state ?? 'open',
        authorName: dto.authorName,
        issueId: issue.id,
      },
      update: { title: dto.title, state: dto.state },
    });
  }

  async deleteBranch(id: string, userId: string) {
    const branch = await this.prisma.gitBranch.findUnique({ where: { id }, include: { issue: true } });
    if (!branch) throw new NotFoundException('Branch link not found');
    await this.assertAccess(branch.issue.projectId, userId);
    await this.prisma.gitBranch.delete({ where: { id } });
    return { success: true };
  }

  async processGitHubWebhook(projectKey: string, payload: any) {
    // Parse issue keys from commits, PR titles, and branch names
    const issueNumbers = new Set<number>();

    const extractFromText = (text: string) => {
      let m: RegExpExecArray | null;
      while ((m = ISSUE_KEY_RE.exec(text)) !== null) {
        if (m[1] === projectKey) issueNumbers.add(parseInt(m[2]));
      }
      ISSUE_KEY_RE.lastIndex = 0;
    };

    const project = await this.prisma.project.findFirst({ where: { key: projectKey } });
    if (!project) return { processed: 0 };

    if (payload.commits) {
      for (const c of payload.commits) {
        extractFromText(c.message ?? '');
        if (issueNumbers.size) {
          for (const num of issueNumbers) {
            const issue = await this.prisma.issue.findUnique({
              where: { projectId_number: { projectId: project.id, number: num } },
            });
            if (issue) {
              await this.prisma.gitCommit.upsert({
                where: { issueId_sha: { issueId: issue.id, sha: c.id } },
                create: {
                  sha: c.id, message: c.message, url: c.url,
                  authorName: c.author?.name, issueId: issue.id,
                  committedAt: c.timestamp ? new Date(c.timestamp) : undefined,
                },
                update: { message: c.message },
              });
            }
          }
          issueNumbers.clear();
        }
      }
    }

    if (payload.pull_request) {
      const pr = payload.pull_request;
      extractFromText(pr.title ?? '');
      extractFromText(pr.body ?? '');
      extractFromText(pr.head?.ref ?? '');
      for (const num of issueNumbers) {
        const issue = await this.prisma.issue.findUnique({
          where: { projectId_number: { projectId: project.id, number: num } },
        });
        if (issue) {
          await this.prisma.gitPullRequest.upsert({
            where: { issueId_url: { issueId: issue.id, url: pr.html_url } },
            create: {
              number: pr.number, title: pr.title, url: pr.html_url,
              state: pr.state, authorName: pr.user?.login, issueId: issue.id,
              mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
            },
            update: { title: pr.title, state: pr.state, mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined },
          });
        }
      }
    }

    return { processed: issueNumbers.size };
  }

  private async findIssue(projectId: string, number: number) {
    const issue = await this.prisma.issue.findUnique({
      where: { projectId_number: { projectId, number } },
    });
    if (!issue) throw new NotFoundException('Issue not found');
    return issue;
  }

  private async assertAccess(projectId: string, userId: string) {
    const ok = await this.projectsRepository.isMember(projectId, userId);
    if (!ok) throw new ForbiddenException('Access denied');
  }
}
