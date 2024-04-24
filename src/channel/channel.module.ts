import { BullModule } from '@nestjs/bull'
import { CacheModule, Module, forwardRef } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ChannelController } from './channel.controller'
import { ChannelRepository } from './channel.repository'
import { ChannelService } from './channel.service'
import { AuthModule } from '../auth/auth.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as redisStore from 'cache-manager-redis-store'
import { CommonService } from '../common/common.service'
import { UserModule } from '../user/user.module'
@Module({
  controllers: [ChannelController],
  providers: [ChannelService, ChannelRepository, CommonService],
  imports: [
    forwardRef(() => AuthModule),
    UserModule,
    PrismaModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get<number>('CHANNEL_EXPIRED'), // 10 days
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
  exports: [ChannelService],
})
export class ChannelModule {}
