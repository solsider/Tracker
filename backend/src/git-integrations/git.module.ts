import { Module } from '@nestjs/common';
import { GitController, GitBranchController, GitHubWebhookController } from './git.controller';
import { GitService } from './git.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [PrismaModule, ProjectsModule],
  controllers: [GitController, GitBranchController, GitHubWebhookController],
  providers: [GitService],
  exports: [GitService],
})
export class GitModule {}
