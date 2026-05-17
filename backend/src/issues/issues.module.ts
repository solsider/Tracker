import { Module } from '@nestjs/common';
import { IssuesController, IssuesColumnController } from './issues.controller';
import { IssuesService } from './issues.service';
import { IssuesRepository } from './issues.repository';
import { ProjectsModule } from '../projects/projects.module';
import { ColumnsModule } from '../columns/columns.module';

@Module({
  imports: [ProjectsModule, ColumnsModule],
  controllers: [IssuesController, IssuesColumnController],
  providers: [IssuesService, IssuesRepository],
  exports: [IssuesService, IssuesRepository],
})
export class IssuesModule {}
