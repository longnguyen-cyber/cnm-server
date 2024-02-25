/* eslint-disable prettier/prettier */
import {
  CacheModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common'
import * as redisStore from 'cache-manager-redis-store'
import { Middleware } from './app.middleware'
import { AuthModule } from './auth/auth.module'
import { ChannelModule } from './channel/channel.module'
import { ChatModule } from './chat/chat.module'
import { PrismaModule } from './prisma/prisma.module'
// import { ThreadController } from './thread/thread.controller'
import { ThreadModule } from './thread/thread.module'
import { UploadModule } from './upload/upload.module'
import { UserController } from './user/user.controller'
import { UserModule } from './user/user.module'

import { HandlebarsAdapter, MailerModule } from '@nest-modules/mailer'
import { BullModule } from '@nestjs/bull'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { join } from 'path'
import { SocketGateway } from './socket/socket.gateway'
import { CommonService } from './common/common.service'
import { AppController } from './app.controller'
import { AppService } from './app.service'
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
        host: 'redis',
        port: configService.get<number>('REDIS_PORT'),
        username: configService.get<string>('REDIS_USERNAME'),
        password: configService.get<string>('REDIS_PASSWORD'),
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: async (config: ConfigService) => ({
        redis: {
          // host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,

    UploadModule,
  ],
  providers: [SocketGateway, CommonService, AppService],
  controllers: [UserController, AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(Middleware).forRoutes('api/threads')
  }
}
