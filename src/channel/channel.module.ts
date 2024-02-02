import { CacheModule, Module, forwardRef } from '@nestjs/common'
import { ChannelService } from './channel.service'
import { ChannelController } from './channel.controller'
import { ChannelRepository } from './channel.repository'
import { AuthModule } from '../auth/auth.module'
import { CommonModule } from '../common/common.module'
import { PrismaModule } from '../prisma/prisma.module'
import { UserCheck } from '../user/user.check'
import { UserRepository } from '../user/user.repository'
import { UserService } from '../user/user.service'
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module'
import { BullModule } from '@nestjs/bull'

@Module({
  controllers: [ChannelController],
  providers: [
    ChannelService,
    ChannelRepository,
    UserService,
    UserRepository,
    UserCheck,
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
  exports: [ChannelService],
})
export class ChannelModule {}
