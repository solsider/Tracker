import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsRepository } from '../projects/projects.repository';
import { CreateWebhookDto, UpdateWebhookDto } from './webhooks.dto';

const SUPPORTED_EVENTS = [
  'issue.created', 'issue.updated', 'issue.deleted',
  'sprint.started', 'sprint.completed', 'sprint.created',
  'comment.created', 'assignment.changed',
];

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private projectsRepository: ProjectsRepository,
  ) {}

  async create(projectId: string, dto: CreateWebhookDto, userId: string) {
    await this.assertAdmin(projectId, userId);
    return this.prisma.webhook.create({
      data: {
        name: dto.name,
        url: dto.url,
        secret: dto.secret,
        events: dto.events.filter((e) => SUPPORTED_EVENTS.includes(e)),
        project: { connect: { id: projectId } },
      },
    });
  }

  async list(projectId: string, userId: string) {
    await this.assertAccess(projectId, userId);
    return this.prisma.webhook.findMany({
      where: { projectId },
      select: {
        id: true, name: true, url: true, events: true,
        isActive: true, createdAt: true, updatedAt: true,
        _count: { select: { deliveries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateWebhookDto, userId: string) {
    const hook = await this.findAndAssertAdmin(id, userId);
    return this.prisma.webhook.update({
      where: { id },
      data: {
        name: dto.name,
        url: dto.url,
        secret: dto.secret ?? hook.secret,
        events: dto.events?.filter((e) => SUPPORTED_EVENTS.includes(e)),
        isActive: dto.isActive,
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.findAndAssertAdmin(id, userId);
    await this.prisma.webhook.delete({ where: { id } });
    return { success: true };
  }

  async getDeliveries(id: string, userId: string) {
    const hook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!hook) throw new NotFoundException('Webhook not found');
    await this.assertAccess(hook.projectId, userId);
    return this.prisma.webhookDelivery.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async fire(projectId: string, event: string, payload: object) {
    const hooks = await this.prisma.webhook.findMany({
      where: { projectId, isActive: true, events: { has: event } },
    });

    for (const hook of hooks) {
      await this.deliver(hook, event, payload);
    }
  }

  private async deliver(
    hook: { id: string; url: string; secret: string | null },
    event: string,
    payload: object,
    attempt = 1,
  ) {
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tracker-Event': event,
      'X-Tracker-Delivery': `${hook.id}-${Date.now()}`,
    };

    if (hook.secret) {
      const sig = createHmac('sha256', hook.secret).update(body).digest('hex');
      headers['X-Tracker-Signature'] = `sha256=${sig}`;
    }

    const start = Date.now();
    let delivery: any;

    try {
      const res = await fetch(hook.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(10000) });
      const text = await res.text().catch(() => '');
      const durationMs = Date.now() - start;

      delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookId: hook.id,
          event,
          payload,
          statusCode: res.status,
          response: text.slice(0, 500),
          durationMs,
          attempts: attempt,
          ...(res.ok ? { succeededAt: new Date() } : { failedAt: new Date() }),
        },
      });

      if (!res.ok && attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => this.deliver(hook, event, payload, attempt + 1), delay);
      }
    } catch (err) {
      const durationMs = Date.now() - start;
      delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookId: hook.id,
          event,
          payload,
          durationMs,
          attempts: attempt,
          failedAt: new Date(),
          response: String(err).slice(0, 500),
        },
      });

      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => this.deliver(hook, event, payload, attempt + 1), delay);
      }

      this.logger.warn(`Webhook delivery failed for ${hook.url}: ${err}`);
    }

    return delivery;
  }

  private async findAndAssertAdmin(id: string, userId: string) {
    const hook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!hook) throw new NotFoundException('Webhook not found');
    await this.assertAdmin(hook.projectId, userId);
    return hook;
  }

  private async assertAdmin(projectId: string, userId: string) {
    const member = await this.projectsRepository.getMember(projectId, userId);
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('Only project admins can manage webhooks');
    }
  }

  private async assertAccess(projectId: string, userId: string) {
    const ok = await this.projectsRepository.isMember(projectId, userId);
    if (!ok) throw new ForbiddenException('Access denied');
  }
}
