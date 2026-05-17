import { Module } from '@nestjs/common';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';
import { ChecklistsRepository } from './checklists.repository';
import { ProjectsModule } from '../projects/projects.module';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [ProjectsModule, IssuesModule],
  controllers: [ChecklistsController],
  providers: [ChecklistsService, ChecklistsRepository],
})
export class ChecklistsModule {}
