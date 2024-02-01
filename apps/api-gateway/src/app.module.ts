import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';

import { ChatModule } from './chat/chat.module';
import { ThreadModule } from './thread/thread.module';
import { UserModule } from './user/user.module';
import { RabbitMQModule } from '@app/rabbitmq';
import { UploadModule } from 'apps/upload/src/upload.module';
import { ChannelModule } from './channel/channel.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { HandlebarsAdapter, MailerModule } from '@nest-modules/mailer';
import { join } from 'path';
import { BullModule } from '@nestjs/bull';
import { EmailConsumer } from './consumer/emai.consumer';
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
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        // transport: config.get('MAIL_TRANSPORT'),
        transport: {
          host: config.get('MAIL_HOST'),
          secure: false,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"No Reply" <${config.get('MAIL_FROM')}>`,
        },
        template: {
          dir: join(__dirname, '..', '..', '..', 'src/email'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          // username: config.get('REDIS_USERNAME'),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'send-mail',
    }),
  ],
  controllers: [AppController],
  providers: [EmailConsumer],
})
export class AppModule {}
