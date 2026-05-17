import { Module } from '@nestjs/common';
import { TimeTrackingController } from './time-tracking.controller';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTrackingRepository } from './time-tracking.repository';
import { ProjectsModule } from '../projects/projects.module';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [ProjectsModule, IssuesModule],
  controllers: [TimeTrackingController],
  providers: [TimeTrackingService, TimeTrackingRepository],
})
export class TimeTrackingModule {}
