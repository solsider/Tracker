import { Injectable, Optional } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Injectable()
export class EventsService {
  constructor(
    @Optional() private readonly gateway?: EventsGateway,
    @Optional() private readonly webhooksService?: any,
  ) {}

  private emit(room: string, event: string, data: unknown): void {
    this.gateway?.emitToRoom(room, event, data);
  }

  // ── Issue events ──────────────────────────────────────────────────────────

  issueCreated(projectId: string, issue: unknown): void {
    this.emit(`project:${projectId}`, 'issue:created', { projectId, issue });
    this.webhooksService?.fire(projectId, 'issue.created', { issue });
  }

  issueUpdated(projectId: string, issue: unknown): void {
    this.emit(`project:${projectId}`, 'issue:updated', { projectId, issue });
    if ((issue as any).id) {
      this.emit(`issue:${(issue as any).id}`, 'issue:updated', { issue });
    }
    this.webhooksService?.fire(projectId, 'issue.updated', { issue });
  }

  issueDeleted(projectId: string, issueId: string, number: number): void {
    this.emit(`project:${projectId}`, 'issue:deleted', { projectId, issueId, number });
    this.webhooksService?.fire(projectId, 'issue.deleted', { issueId, number });
  }

  issueMoved(projectId: string, issue: unknown): void {
    this.emit(`project:${projectId}`, 'issue:moved', { projectId, issue });
    this.webhooksService?.fire(projectId, 'issue.updated', { issue });
  }

  // ── Sprint events ─────────────────────────────────────────────────────────

  sprintCreated(projectId: string, sprint: unknown): void {
    this.emit(`project:${projectId}`, 'sprint:created', { projectId, sprint });
    this.webhooksService?.fire(projectId, 'sprint.created', { sprint });
  }

  sprintUpdated(projectId: string, sprint: unknown): void {
    this.emit(`project:${projectId}`, 'sprint:updated', { projectId, sprint });
    const s = sprint as any;
    if (s?.status === 'ACTIVE') this.webhooksService?.fire(projectId, 'sprint.started', { sprint });
    if (s?.status === 'COMPLETED') this.webhooksService?.fire(projectId, 'sprint.completed', { sprint });
  }

  sprintDeleted(projectId: string, sprintId: string): void {
    this.emit(`project:${projectId}`, 'sprint:deleted', { projectId, sprintId });
  }

  // ── Comment events ────────────────────────────────────────────────────────

  commentCreated(projectId: string, issueId: string, comment: unknown): void {
    this.emit(`project:${projectId}`, 'comment:created', { projectId, issueId, comment });
    this.emit(`issue:${issueId}`, 'comment:created', { issueId, comment });
    this.webhooksService?.fire(projectId, 'comment.created', { issueId, comment });
  }

  commentUpdated(issueId: string, comment: unknown): void {
    this.emit(`issue:${issueId}`, 'comment:updated', { issueId, comment });
  }

  commentDeleted(issueId: string, commentId: string): void {
    this.emit(`issue:${issueId}`, 'comment:deleted', { issueId, commentId });
  }

  // ── Attachment events ─────────────────────────────────────────────────────

  attachmentAdded(projectId: string, issueId: string, attachment: unknown): void {
    this.emit(`project:${projectId}`, 'attachment:added', { projectId, issueId, attachment });
    this.emit(`issue:${issueId}`, 'attachment:added', { issueId, attachment });
  }

  attachmentDeleted(projectId: string, issueId: string, attachmentId: string): void {
    this.emit(`project:${projectId}`, 'attachment:deleted', { projectId, issueId, attachmentId });
    this.emit(`issue:${issueId}`, 'attachment:deleted', { issueId, attachmentId });
  }

  // ── Notification events ───────────────────────────────────────────────────

  notificationCreated(userId: string, notification: unknown): void {
    this.emit(`user:${userId}`, 'notification', notification);
  }
}
