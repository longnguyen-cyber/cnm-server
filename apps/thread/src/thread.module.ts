import { Module } from '@nestjs/common';
import { ThreadController } from './thread.controller';
import { ThreadService } from './thread.service';
import { ThreadRepository } from './thread.repository';
import { CommonModule, PrismaModule } from '@app/common';

@Module({
  imports: [CommonModule, PrismaModule],
  controllers: [ThreadController],
  providers: [ThreadService, ThreadRepository],
})
export class ThreadModule {}
