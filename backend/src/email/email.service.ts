import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly from: string;

  constructor() {
    this.from = process.env.SMTP_FROM || 'Tracker <noreply@tracker.app>';

    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      this.logger.log(`Email transport configured: ${process.env.SMTP_HOST}`);
    } else {
      this.logger.warn('SMTP not configured — emails will be logged only');
    }
  }

  async send(payload: EmailPayload): Promise<void> {
    if (!this.transporter) {
      this.logger.debug(`[EMAIL SKIPPED] To: ${payload.to} | Subject: ${payload.subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text ?? payload.subject,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${payload.to}: ${err}`);
    }
  }

  sendAssignmentAlert(to: string, issueTitle: string, issueUrl: string, projectName: string) {
    return this.send({
      to,
      subject: `[${projectName}] Вам назначена задача: ${issueTitle}`,
      html: `<p>Вам назначена задача <a href="${issueUrl}"><strong>${issueTitle}</strong></a> в проекте ${projectName}.</p>`,
    });
  }

  sendCommentNotification(to: string, commenterName: string, issueTitle: string, issueUrl: string, commentBody: string) {
    return this.send({
      to,
      subject: `Новый комментарий в задаче: ${issueTitle}`,
      html: `<p><strong>${commenterName}</strong> прокомментировал задачу <a href="${issueUrl}"><strong>${issueTitle}</strong></a>:</p><blockquote>${commentBody}</blockquote>`,
    });
  }

  sendMentionAlert(to: string, mentionerName: string, issueTitle: string, issueUrl: string) {
    return this.send({
      to,
      subject: `${mentionerName} упомянул вас в задаче: ${issueTitle}`,
      html: `<p><strong>${mentionerName}</strong> упомянул вас в задаче <a href="${issueUrl}"><strong>${issueTitle}</strong></a>.</p>`,
    });
  }

  sendOverdueDigest(to: string, issues: { title: string; url: string; dueDate: string }[]) {
    const rows = issues
      .map((i) => `<li><a href="${i.url}">${i.title}</a> — срок: ${i.dueDate}</li>`)
      .join('');
    return this.send({
      to,
      subject: `Напоминание: ${issues.length} просроченных задач`,
      html: `<p>У вас есть просроченные задачи:</p><ul>${rows}</ul>`,
    });
  }
}
