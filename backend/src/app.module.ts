import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from './common/logger/logger.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { ColumnsModule } from './columns/columns.module';
import { IssuesModule } from './issues/issues.module';
import { CommentsModule } from './comments/comments.module';
import { GroupsModule } from './groups/groups.module';
import { ActivityModule } from './activity/activity.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SprintsModule } from './sprints/sprints.module';
import { LabelsModule } from './labels/labels.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { IssueLinksModule } from './issue-links/issue-links.module';
import { EventsModule } from './events/events.module';
import { UploadsModule } from './uploads/uploads.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { EmailModule } from './email/email.module';
import { GitModule } from './git-integrations/git.module';
import { ReleasesModule } from './releases/releases.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    LoggerModule,
    HealthModule,
    MetricsModule,
    TelemetryModule,
    EventsModule,
    EmailModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    ColumnsModule,
    IssuesModule,
    CommentsModule,
    GroupsModule,
    ActivityModule,
    NotificationsModule,
    SprintsModule,
    LabelsModule,
    ChecklistsModule,
    TimeTrackingModule,
    IssueLinksModule,
    UploadsModule,
    ApiKeysModule,
    WebhooksModule,
    GitModule,
    ReleasesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, RequestLoggerMiddleware).forRoutes('*');
  }
}
