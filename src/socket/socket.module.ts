import { CacheModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as redisStore from 'cache-manager-redis-store'
import { AppService } from '../app.service'
import { ChannelService } from '../channel/channel.service'
import { ChatService } from '../chat/chat.service'
import { CommonService } from '../common/common.service'
import { PrismaService } from '../prisma/prisma.service'
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module'
import { ThreadRepository } from '../thread/thread.repository'
import { ThreadService } from '../thread/thread.service'
import { SocketGateway } from './socket.gateway'
import { ChannelRepository } from '../channel/channel.repository'
import { ChatRepository } from '../chat/chat.repository'
@Module({
  providers: [
    SocketGateway,
    ThreadService,
    ThreadRepository,
    CommonService,
    AppService,
    PrismaService,
    ChannelService,
    ChatService,
    ChannelRepository,
    ChatRepository,
  ],
  imports: [
    RabbitMQModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ttl: 60 * 60 * 24 * 10, // 10 days
        isGlobal: true,
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        username: configService.get<string>('REDIS_USERNAME'),
        password: configService.get<string>('REDIS_PASSWORD'),
      }),
    }),
  ],
  exports: [SocketGateway],
})
export class SocketModule {}
