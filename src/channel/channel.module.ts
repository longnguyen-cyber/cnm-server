import { BullModule } from '@nestjs/bull'
import { CacheModule, Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module'
import { ChannelController } from './channel.controller'
import { ChannelRepository } from './channel.repository'
import { ChannelService } from './channel.service'

@Module({
  controllers: [ChannelController],
  providers: [ChannelService, ChannelRepository],
  imports: [
    PrismaModule,
    CacheModule.register(),
    RabbitMQModule,
    BullModule.registerQueue({
      name: 'send-mail',
    }),
  ],
  exports: [ChannelService],
})
export class ChannelModule {}
