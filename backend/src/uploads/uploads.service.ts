import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LocalStorageService } from './storage/local.storage';
import { ProjectsRepository } from '../projects/projects.repository';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsService } from '../events/events.service';
import { validateMagicBytes } from './mime-validator';

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'text/plain', 'text/csv', 'text/markdown',
  'application/json',
  'application/zip', 'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
]);

// Extensions that are never allowed regardless of MIME
const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar',
  '.msi', '.dll', '.so', '.dylib', '.com', '.scr', '.hta', '.pif',
]);

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

const authorSelect = { select: { id: true, name: true, avatar: true } } as const;

@Injectable()
export class UploadsService {
  constructor(
    private prisma: PrismaService,
    private storage: LocalStorageService,
    private projectsRepository: ProjectsRepository,
    @Optional() private activityService?: ActivityService,
    @Optional() private notificationsService?: NotificationsService,
    @Optional() private eventsService?: EventsService,
  ) {}

  async uploadToIssue(
    projectId: string,
    issueNumber: number,
    file: Express.Multer.File,
    uploaderId: string,
  ) {
    await this.assertMember(projectId, uploaderId);
    await this.validateFile(file);

    const issue = await this.prisma.issue.findUnique({
      where: { projectId_number: { projectId, number: issueNumber } },
      include: {
        watchers: { select: { userId: true } },
      },
    });
    if (!issue) throw new NotFoundException('Issue not found');

    const stored = await this.storage.store(file);

    const attachment = await this.prisma.attachment.create({
      data: {
        filename: stored.filename,
        originalName: sanitizeFilename(file.originalname),
        mimetype: file.mimetype,
        size: stored.size,
        url: stored.url,
        issue: { connect: { id: issue.id } },
        uploader: { connect: { id: uploaderId } },
      },
      include: { uploader: authorSelect },
    });

    // Activity log
    this.activityService?.log({
      userId: uploaderId,
      action: 'ATTACHMENT_ADDED',
      issueId: issue.id,
      projectId,
      newValue: attachment.originalName,
    }).catch(() => undefined);

    // Notify watchers + assignee + reporter (skip uploader) — single batch insert
    const recipientIds = new Set<string>(issue.watchers.map((w) => w.userId));
    if (issue.assigneeId) recipientIds.add(issue.assigneeId);
    if (issue.reporterId) recipientIds.add(issue.reporterId);
    recipientIds.delete(uploaderId);

    const uploader = attachment.uploader as { name: string };
    this.notificationsService?.notifyMany([...recipientIds], {
      type: 'ATTACHMENT_ADDED',
      title: 'Новое вложение',
      body: `${uploader.name} прикрепил файл "${attachment.originalName}"`,
      actorId: uploaderId,
      issueId: issue.id,
      projectId,
    }).catch(() => undefined);

    // Realtime
    this.eventsService?.attachmentAdded(projectId, issue.id, attachment);

    return attachment;
  }

  async uploadManyToIssue(
    projectId: string,
    issueNumber: number,
    files: Express.Multer.File[],
    uploaderId: string,
  ) {
    return Promise.all(
      files.map((f) => this.uploadToIssue(projectId, issueNumber, f, uploaderId)),
    );
  }

  async listForIssue(projectId: string, issueNumber: number, userId: string) {
    await this.assertMember(projectId, userId);
    const issue = await this.prisma.issue.findUnique({
      where: { projectId_number: { projectId, number: issueNumber } },
    });
    if (!issue) throw new NotFoundException('Issue not found');

    return this.prisma.attachment.findMany({
      where: { issueId: issue.id },
      include: { uploader: authorSelect },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(attachmentId: string, userId: string) {
    const att = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { issue: { select: { projectId: true } } },
    });
    if (!att) throw new NotFoundException('Attachment not found');
    await this.assertMember((att.issue as any).projectId, userId);
    return att;
  }

  async delete(attachmentId: string, userId: string) {
    const att = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { issue: { select: { id: true, projectId: true, number: true } } },
    });
    if (!att) throw new NotFoundException('Attachment not found');

    const issue = att.issue as { id: string; projectId: string; number: number };
    const canDelete = await this.canDelete(att.uploaderId, issue.projectId, userId);
    if (!canDelete) throw new ForbiddenException('Insufficient permissions to delete this attachment');

    await this.storage.delete(att.filename);
    await this.prisma.attachment.delete({ where: { id: attachmentId } });

    // Activity log
    this.activityService?.log({
      userId,
      action: 'ATTACHMENT_REMOVED',
      issueId: issue.id,
      projectId: issue.projectId,
      oldValue: att.originalName,
    }).catch(() => undefined);

    // Realtime
    this.eventsService?.attachmentDeleted(issue.projectId, issue.id, attachmentId);

    return { success: true };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async validateFile(file: Express.Multer.File): Promise<void> {
    if (!file) throw new BadRequestException('No file provided');

    const ext = getExtension(file.originalname).toLowerCase();
    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      throw new BadRequestException(`File extension ${ext} is not allowed`);
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(`File type "${file.mimetype}" is not allowed`);
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File exceeds 20 MB size limit');
    }
    // Magic bytes check — cross-validates actual file content vs declared MIME
    await validateMagicBytes(file);
  }

  private async assertMember(projectId: string, userId: string) {
    const ok = await this.projectsRepository.isMember(projectId, userId);
    if (!ok) throw new ForbiddenException('Access denied');
  }

  private async canDelete(uploaderId: string, projectId: string, userId: string): Promise<boolean> {
    if (uploaderId === userId) return true;
    // Project owner/admin can also delete
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });
    if (member && (member.role === 'OWNER' || member.role === 'ADMIN')) return true;
    // Check if user is project owner (ownerId on Project)
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    return project?.ownerId === userId;
  }
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, '_') // strip path separators and forbidden chars
    .replace(/\.{2,}/g, '.')        // collapse consecutive dots
    .slice(0, 255);                 // max 255 chars
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx) : '';
}
