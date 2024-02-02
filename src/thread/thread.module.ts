import { CacheModule, Module, forwardRef } from '@nestjs/common'
import { ThreadService } from './thread.service'
import { ThreadController } from './thread.controller'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from '../common/common.module'
import { PrismaModule } from '../prisma/prisma.module'
import { ThreadRepository } from './thread.repository'
import { UserService } from '../user/user.service'
import { UserCheck } from '../user/user.check'
import { UserRepository } from '../user/user.repository'
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module'
import { BullModule } from '@nestjs/bull'

@Module({
  controllers: [ThreadController],
  providers: [
    ThreadService,
    ThreadRepository,
    UserService,
    UserCheck,
    UserRepository,
  ],
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    CommonModule,
    CacheModule.register(),
    RabbitMQModule,
    BullModule.registerQueue({
      name: 'send-mail',
    }),
  ],
  exports: [ThreadService],
})
export class ThreadModule {}
