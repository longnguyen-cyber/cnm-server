import {
  AddUserToChannelDto,
  CHANNEL_SERVICE_NAME,
  Channel,
  ChannelCreateDto,
  ChannelServiceClient,
  ChannelUpdateDto,
  FindChannel,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CHANNEL_SERVICE } from './constants';

@Injectable()
export class ChannelService implements OnModuleInit {
  private channelService: ChannelServiceClient;
  constructor(@Inject(CHANNEL_SERVICE) private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.channelService =
      this.client.getService<ChannelServiceClient>(CHANNEL_SERVICE_NAME);
  }

  async createChannel(
    channelCreateDto: ChannelCreateDto,
  ): Promise<Channel | any> {
    return this.channelService.createChannel(channelCreateDto);
  }

  async updateChannel(channel: ChannelUpdateDto): Promise<Channel | any> {
    return this.channelService.updateChannel(channel);
  }

  async deleteChannel(channelId: FindChannel): Promise<Channel | any> {
    return this.channelService.deleteChannel(channelId);
  }

  async getChannelById(channelId: FindChannel): Promise<any> {
    console.log(channelId);
    return this.channelService.getChannelById(channelId);
  }

  async getAllChannel(): Promise<any> {
    const data = this.channelService.getAllChannels({});

    return data;
  }

  async addUserToChannel(add: AddUserToChannelDto): Promise<Channel | any> {
    return this.channelService.addUserToChannel(add);
  }
}
