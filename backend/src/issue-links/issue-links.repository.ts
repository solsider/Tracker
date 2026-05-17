import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IssueLinkType } from '@prisma/client';

const issueStub = {
  select: { id: true, number: true, title: true, priority: true, type: true },
} as const;

@Injectable()
export class IssueLinksRepository {
  constructor(private prisma: PrismaService) {}

  async findByIssue(issueId: string) {
    const [asSource, asTarget] = await Promise.all([
      this.prisma.issueLink.findMany({
        where: { sourceId: issueId },
        include: { target: issueStub },
      }),
      this.prisma.issueLink.findMany({
        where: { targetId: issueId },
        include: { source: issueStub },
      }),
    ]);
    return { outgoing: asSource, incoming: asTarget };
  }

  async create(sourceId: string, targetId: string, type: IssueLinkType) {
    return this.prisma.issueLink.create({
      data: { sourceId, targetId, type },
      include: { source: issueStub, target: issueStub },
    });
  }

  async findById(id: string) {
    return this.prisma.issueLink.findUnique({
      where: { id },
      include: { source: { select: { projectId: true } } },
    });
  }

  async delete(id: string) {
    await this.prisma.issueLink.delete({ where: { id } });
  }
}
