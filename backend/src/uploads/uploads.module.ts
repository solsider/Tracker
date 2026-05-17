import { Module } from '@nestjs/common';
import { UploadsController, AttachmentController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { LocalStorageService } from './storage/local.storage';
import { S3StorageService } from './storage/s3.storage';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';

const storageProvider = {
  provide: LocalStorageService,
  useFactory: () => {
    if (process.env.STORAGE_DRIVER === 's3') {
      return new S3StorageService();
    }
    return new LocalStorageService();
  },
};

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    ActivityModule,
    NotificationsModule,
  ],
  controllers: [UploadsController, AttachmentController],
  providers: [UploadsService, storageProvider],
  exports: [UploadsService],
})
export class UploadsModule {}
