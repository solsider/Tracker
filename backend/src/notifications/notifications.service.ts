import { Injectable } from '@nestjs/common';
import { NotificationsRepository, CreateNotificationParams } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private notificationsRepository: NotificationsRepository) {}

  async notify(params: CreateNotificationParams): Promise<void> {
    await this.notificationsRepository.create(params);
  }

  async notifyMany(recipients: string[], base: Omit<CreateNotificationParams, 'userId'>): Promise<void> {
    if (recipients.length === 0) return;
    await this.notificationsRepository.createMany(
      recipients.map((userId) => ({ ...base, userId })),
    );
  }

  async getForUser(userId: string, unreadOnly = false, limit = 50) {
    return this.notificationsRepository.findByUser(userId, unreadOnly, limit);
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationsRepository.countUnread(userId);
    return { count };
  }

  async markRead(id: string, userId: string) {
    await this.notificationsRepository.markRead(id, userId);
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.notificationsRepository.markAllRead(userId);
    return { success: true };
  }
}
