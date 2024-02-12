import { CacheModule, Module, forwardRef } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserCheck } from './user.check'
import { UserRepository } from './user.repository'
import { BullModule } from '@nestjs/bull'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from '../common/common.module'
import { EmailConsumer } from '../consumers/email.consummer'
import { PrismaModule } from '../prisma/prisma.module'
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as redisStore from 'cache-manager-redis-store'
import { JwtModule } from '@nestjs/jwt'
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, UserCheck, EmailConsumer],
  imports: [
    forwardRef(() => AuthModule),
    RabbitMQModule,
    PrismaModule,
    CommonModule,
    ConfigModule,
    JwtModule.register({
      secret: 'secret',
      signOptions: { expiresIn: '1d' },
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ttl: 60 * 60 * 24 * 10, // 10 days
        isGlobal: true,
        store: redisStore,
        // host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        username: configService.get<string>('REDIS_USERNAME'),
        password: configService.get<string>('REDIS_PASSWORD'),
      }),
    }),
    BullModule.registerQueue({
      name: 'send-mail',
    }),
  ],
  exports: [UserService, UserCheck],
})
export class UserModule {}
