import { CacheModule, Module, forwardRef } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserCheck } from './user.check'
import { UserRepository } from './user.repository'
import { BullModule } from '@nestjs/bull'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from '../common/common.module'
import { EmailConsumer } from '../consumers/queue.consummer'
import { PrismaModule } from '../prisma/prisma.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as redisStore from 'cache-manager-redis-store'
import { JwtModule } from '@nestjs/jwt'
import { ChatModule } from '../chat/chat.module'
import { UploadModule } from '../upload/upload.module'
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, UserCheck, EmailConsumer],
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    CommonModule,
    ChatModule,
    ConfigModule,
    UploadModule,
    JwtModule.register({
      secret: 'secret',
      signOptions: { expiresIn: '1d' },
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
    BullModule.registerQueue({
      name: 'queue',
    }),
  ],
  exports: [UserService, UserCheck],
})
export class UserModule {}
