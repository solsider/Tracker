import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuthPayload {
  sub: string;
  email: string;
  name: string;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  // socketId → user payload
  private readonly userMap = new Map<string, AuthPayload>();
  // projectId → Set<socketId> (presence)
  private readonly projectViewers = new Map<string, Set<string>>();
  // issueId → Set<socketId> (presence)
  private readonly issueViewers = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private _cookieToken(cookieHeader: string | undefined): string | undefined {
    if (!cookieHeader) return undefined;
    const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
    return match?.[1];
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        this._cookieToken(client.handshake.headers.cookie as string) ||
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        this.logger.error('JWT_SECRET is not set — rejecting WebSocket connection');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<AuthPayload>(token, { secret: jwtSecret });

      this.userMap.set(client.id, payload);
      client.join(`user:${payload.sub}`);
      this.logger.debug(`Connected: ${payload.email} (${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.userMap.get(client.id);
    if (user) {
      this.logger.debug(`Disconnected: ${user.email} (${client.id})`);
      this._cleanPresence(client.id);
      this.userMap.delete(client.id);
    }
  }

  // ── Room subscriptions ────────────────────────────────────────────────────

  @SubscribeMessage('join-project')
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const user = this.userMap.get(client.id);
    if (!user || !data?.projectId) return;

    try {
      const allowed = await this._isProjectMember(data.projectId, user.sub);
      if (!allowed) {
        this.logger.warn(`Unauthorized project join attempt: user=${user.email} project=${data.projectId}`);
        client.emit('error', { message: 'Access denied', room: `project:${data.projectId}` });
        return;
      }

      client.join(`project:${data.projectId}`);
      if (!this.projectViewers.has(data.projectId)) {
        this.projectViewers.set(data.projectId, new Set());
      }
      this.projectViewers.get(data.projectId)!.add(client.id);
    } catch (err) {
      this.logger.error(`Failed to join project ${data.projectId}: ${err}`);
      client.emit('error', { message: 'Failed to join project room' });
    }
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    client.leave(`project:${data.projectId}`);
    this.projectViewers.get(data.projectId)?.delete(client.id);
  }

  @SubscribeMessage('join-issue')
  async handleJoinIssue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { issueId: string },
  ) {
    const user = this.userMap.get(client.id);
    if (!user || !data?.issueId) return;

    try {
      const allowed = await this._canAccessIssue(data.issueId, user.sub);
      if (!allowed) {
        this.logger.warn(`Unauthorized issue join attempt: user=${user.email} issue=${data.issueId}`);
        client.emit('error', { message: 'Access denied', room: `issue:${data.issueId}` });
        return;
      }

      client.join(`issue:${data.issueId}`);
      if (!this.issueViewers.has(data.issueId)) {
        this.issueViewers.set(data.issueId, new Set());
      }
      this.issueViewers.get(data.issueId)!.add(client.id);

      const viewers = this._getIssueViewers(data.issueId);
      this.server.to(`issue:${data.issueId}`).emit('presence:update', { issueId: data.issueId, viewers });
    } catch (err) {
      this.logger.error(`Failed to join issue ${data.issueId}: ${err}`);
      client.emit('error', { message: 'Failed to join issue room' });
    }
  }

  @SubscribeMessage('leave-issue')
  handleLeaveIssue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { issueId: string },
  ) {
    client.leave(`issue:${data.issueId}`);
    this.issueViewers.get(data.issueId)?.delete(client.id);

    const viewers = this._getIssueViewers(data.issueId);
    this.server.to(`issue:${data.issueId}`).emit('presence:update', { issueId: data.issueId, viewers });
  }

  // ── Typing indicators ─────────────────────────────────────────────────────

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { issueId: string },
  ) {
    const user = this.userMap.get(client.id);
    if (!user) return;
    client.to(`issue:${data.issueId}`).emit('typing:update', {
      issueId: data.issueId,
      userId: user.sub,
      userName: user.name,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { issueId: string },
  ) {
    const user = this.userMap.get(client.id);
    if (!user) return;
    client.to(`issue:${data.issueId}`).emit('typing:update', {
      issueId: data.issueId,
      userId: user.sub,
      userName: user.name,
      isTyping: false,
    });
  }

  // ── Public API for EventsService ──────────────────────────────────────────

  emitToRoom(room: string, event: string, data: unknown): void {
    this.server.to(room).emit(event, data);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async _isProjectMember(projectId: string, userId: string): Promise<boolean> {
    try {
      const [member, owned] = await Promise.all([
        this.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId } },
          select: { id: true },
        }),
        this.prisma.project.findFirst({
          where: { id: projectId, ownerId: userId },
          select: { id: true },
        }),
      ]);
      return !!(member || owned);
    } catch {
      return false;
    }
  }

  private async _canAccessIssue(issueId: string, userId: string): Promise<boolean> {
    try {
      const issue = await this.prisma.issue.findUnique({
        where: { id: issueId },
        select: { projectId: true },
      });
      if (!issue) return false;
      return this._isProjectMember(issue.projectId, userId);
    } catch {
      return false;
    }
  }

  private _getIssueViewers(issueId: string) {
    const socketIds = this.issueViewers.get(issueId) ?? new Set<string>();
    return [...socketIds]
      .map((sid) => this.userMap.get(sid))
      .filter(Boolean)
      .map((u) => ({ userId: u!.sub, name: u!.name }));
  }

  private _cleanPresence(socketId: string) {
    for (const [issueId, sids] of this.issueViewers) {
      if (sids.has(socketId)) {
        sids.delete(socketId);
        const viewers = this._getIssueViewers(issueId);
        this.server.to(`issue:${issueId}`).emit('presence:update', { issueId, viewers });
      }
    }
    for (const sids of this.projectViewers.values()) {
      sids.delete(socketId);
    }
  }
}
