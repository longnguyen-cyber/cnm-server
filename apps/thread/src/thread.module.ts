import { Module } from '@nestjs/common';
import { ThreadController } from './thread.controller';
import { ThreadService } from './thread.service';
import { ThreadRepository } from './thread.repository';
import { CommonModule, PrismaModule } from '@app/common';
import { AppGateway } from './app.gateway';

@Module({
  imports: [CommonModule, PrismaModule],
  controllers: [ThreadController],
  providers: [ThreadService, ThreadRepository, AppGateway],
})
export class ThreadModule {}
