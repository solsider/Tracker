import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailPreferencesController } from './email-preferences.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [EmailPreferencesController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
