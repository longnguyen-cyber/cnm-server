import { BullModule } from '@nestjs/bull'
import { CacheModule, Module, forwardRef } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as redisStore from 'cache-manager-redis-store'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from '../common/common.module'
import { PrismaModule } from '../prisma/prisma.module'
import { ChatController } from './chat.controller'
import { ChatRepository } from './chat.repository'
import { ChatService } from './chat.service'
import { UserModule } from '../user/user.module'
import { ThreadModule } from '../thread/thread.module'
@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  imports: [
    PrismaModule,
    CommonModule,
    ThreadModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
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
    BullModule.registerQueue({
      name: 'queue',
    }),
  ],
  exports: [ChatService],
})
export class ChatModule {}
