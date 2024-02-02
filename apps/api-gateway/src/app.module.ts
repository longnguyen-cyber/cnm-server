import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';

import { RabbitMQModule } from '@app/rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadModule } from 'apps/upload/src/upload.module';
import * as redisStore from 'cache-manager-redis-store';
import { ChannelModule } from './channel/channel.module';
import { ChatModule } from './chat/chat.module';
import { ThreadModule } from './thread/thread.module';
import { UserModule } from './user/user.module';
@Module({
  imports: [
    UserModule,
    ThreadModule,
    ChatModule,
    RabbitMQModule,
    UploadModule,
    ChannelModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ttl: 5,
        isGlobal: true,
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        username: configService.get<string>('REDIS_USERNAME'),
        password: configService.get<string>('REDIS_PASSWORD'),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
