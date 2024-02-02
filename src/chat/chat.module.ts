import { CacheModule, Module, forwardRef } from '@nestjs/common'
import { ChatService } from './chat.service'
import { ChatController } from './chat.controller'
import { ChatRepository } from './chat.repository'
import { UserService } from '../user/user.service'
import { UserCheck } from '../user/user.check'
import { UserRepository } from '../user/user.repository'
import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../prisma/prisma.module'
import { CommonModule } from '../common/common.module'
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module'
import { BullModule } from '@nestjs/bull'

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatRepository,
    UserService,
    UserCheck,
    UserRepository,
  ],
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    CommonModule,
    RabbitMQModule,
    CacheModule.register(),
    BullModule.registerQueue({
      name: 'send-mail',
    }),
  ],
  exports: [ChatService],
})
export class ChatModule {}
