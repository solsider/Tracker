import { Module } from '@nestjs/common';
import { SprintsController } from './sprints.controller';
import { SprintsService } from './sprints.service';
import { SprintsRepository } from './sprints.repository';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [SprintsController],
  providers: [SprintsService, SprintsRepository],
  exports: [SprintsService],
})
export class SprintsModule {}
