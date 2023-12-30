import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { UserService } from 'src/user/user.service';
import { UserCheck } from 'src/user/user.check';
import { UserRepository } from 'src/user/user.repository';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatRepository,
    UserService,
    UserCheck,
    UserRepository,
  ],
  imports: [forwardRef(() => AuthModule), PrismaModule, CommonModule],
  exports: [ChatService],
})
export class ChatModule {}
