import { Module } from '@nestjs/common';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { LabelsRepository } from './labels.repository';
import { ProjectsModule } from '../projects/projects.module';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [ProjectsModule, IssuesModule],
  controllers: [LabelsController],
  providers: [LabelsService, LabelsRepository],
  exports: [LabelsService, LabelsRepository],
})
export class LabelsModule {}
