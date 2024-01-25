import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { PrismaModule } from '@app/common';
import { ChannelRepository } from './channel.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ChannelController],
  providers: [ChannelService, ChannelRepository],
})
export class ChannelModule {}
