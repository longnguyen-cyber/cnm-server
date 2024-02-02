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
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as redisStore from 'cache-manager-redis-store'
@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  imports: [
    PrismaModule,
    CommonModule,
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
    BullModule.registerQueue({
      name: 'send-mail',
    }),
  ],
  exports: [ChatService],
})
export class ChatModule {}
