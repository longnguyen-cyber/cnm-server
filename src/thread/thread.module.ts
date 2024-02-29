import { BullModule } from '@nestjs/bull'
import { CacheModule, Module, forwardRef } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { AppService } from '../app.service'
import { AuthModule } from '../auth/auth.module'
import { ChannelRepository } from '../channel/channel.repository'
import { ChannelService } from '../channel/channel.service'
import { ChatRepository } from '../chat/chat.repository'
import { ChatService } from '../chat/chat.service'
import { CommonModule } from '../common/common.module'
import { PrismaModule } from '../prisma/prisma.module'
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module'
import { UploadModule } from '../upload/upload.module'
import { UserCheck } from '../user/user.check'
import { UserRepository } from '../user/user.repository'
import { UserService } from '../user/user.service'
import { ThreadController } from './thread.controller'
import { ThreadRepository } from './thread.repository'
import { ThreadService } from './thread.service'

@Module({
  controllers: [ThreadController],
  providers: [
    ThreadService,
    ThreadRepository,
    UserService,
    UserCheck,
    UserRepository,
    JwtService,
    AppService,
    ChannelRepository,
    ChatRepository,
    ChannelService,
    ChatService,
  ],
  imports: [
    forwardRef(() => AuthModule),
    // forwardRef(() => AppModule),
    ConfigModule,
    PrismaModule,
    CommonModule,
    CacheModule.register(),
    RabbitMQModule,
    UploadModule,
    BullModule.registerQueue({
      name: 'send-mail',
    }),
  ],
  exports: [ThreadService],
})
export class ThreadModule {}
