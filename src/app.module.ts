/* eslint-disable prettier/prettier */
import { MulterModule } from '@nestjs/platform-express'
import { AppGateway } from './app/app.gateway'
import { AuthModule } from './auth/auth.module'
import { ChannelModule } from './channel/channel.module'
import { ChatModule } from './chat/chat.module'
import { PrismaModule } from './prisma/prisma.module'
import { ThreadController } from './thread/thread.controller'
import { ThreadModule } from './thread/thread.module'
import { UserModule } from './user/user.module'
import {
  CacheModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common'
import { Middleware } from './app.middleware'
import { UserController } from './user/user.controller'
import { UploadModule } from './upload/upload.module'
import * as redisStore from 'cache-manager-redis-store'

import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bull'
import { join } from 'path'
import { HandlebarsAdapter, MailerModule } from '@nest-modules/mailer'
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    UserModule,
    PrismaModule,
    ChatModule,
    ThreadModule,
    ChannelModule,
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
          dir: join(__dirname, 'src/templates/email'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
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
    BullModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,

    UploadModule,
  ],
  providers: [AppGateway],
  controllers: [ThreadController, UserController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(Middleware).forRoutes('api/threads')
  }
}
