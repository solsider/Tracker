import { Module } from '@nestjs/common';
import { IssueLinksController } from './issue-links.controller';
import { IssueLinksService } from './issue-links.service';
import { IssueLinksRepository } from './issue-links.repository';
import { ProjectsModule } from '../projects/projects.module';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [ProjectsModule, IssuesModule],
  controllers: [IssueLinksController],
  providers: [IssueLinksService, IssueLinksRepository],
})
export class IssueLinksModule {}
