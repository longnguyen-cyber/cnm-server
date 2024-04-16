import { BullModule } from '@nestjs/bull'
import { CacheModule, Module, forwardRef } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { AppService } from '../app.service'
import { AuthModule } from '../auth/auth.module'
import { ChannelRepository } from '../channel/channel.repository'
import { ChannelService } from '../channel/channel.service'
import { ChatRepository } from '../chat/chat.repository'
import { ChatService } from '../chat/chat.service'
import { CommonModule } from '../common/common.module'
import { PrismaModule } from '../prisma/prisma.module'
import { UploadModule } from '../upload/upload.module'
import { UserCheck } from '../user/user.check'
import { UserRepository } from '../user/user.repository'
import { UserService } from '../user/user.service'
import { ThreadController } from './thread.controller'
import { ThreadRepository } from './thread.repository'
import { ThreadService } from './thread.service'
import * as redisStore from 'cache-manager-redis-store'

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
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        isGlobal: true,
        store: redisStore,

        host: configService.get<string>('REDIS_HOST'),

        port: configService.get<number>('REDIS_PORT'),
        username: configService.get<string>('REDIS_USERNAME'),
        password: configService.get<string>('REDIS_PASSWORD'),
      }),
    }),
    ConfigModule,
    PrismaModule,
    CommonModule,
    UploadModule,
    BullModule.registerQueue({
      name: 'queue',
    }),
  ],
  exports: [ThreadService],
})
export class ThreadModule {}
