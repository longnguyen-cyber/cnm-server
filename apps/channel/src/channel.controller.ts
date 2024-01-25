/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AddUserToChannelDto,
  Channel,
  ChannelCreateDto,
  ChannelServiceController,
  ChannelServiceControllerMethods,
  ChannelUpdateDto,
  Channels,
  Empty,
  FindChannel,
  RemoveUserFromChannelDto,
} from '@app/common';
import { Controller } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChannelService } from './channel.service';

@Controller()
@ChannelServiceControllerMethods()
export class ChannelController implements ChannelServiceController {
  constructor(private readonly channelService: ChannelService) {}
  createChannel(
    request: ChannelCreateDto,
  ): Channel | Promise<Channel> | Observable<Channel> {
    return this.channelService.createChannel(request);
  }
  updateChannel(
    request: ChannelUpdateDto,
  ): Channel | Promise<Channel> | Observable<Channel> {
    return this.channelService.updateChannel(request);
  }
  deleteChannel(
    request: FindChannel,
  ): Channel | Promise<Channel> | Observable<Channel> {
    return this.channelService.deleteChannel(request.id);
  }
  async getAllChannels(_request: Empty): Promise<Channels> {
    const data = await this.channelService.getAllChannels();
    return { channels: data };
  }
  getChannelById(
    request: FindChannel,
  ): Channel | Promise<Channel> | Observable<Channel> {
    return this.channelService.getChannelById(request.id);
  }
  addUserToChannel(
    request: AddUserToChannelDto,
  ): Channel | Promise<Channel> | Observable<Channel> {
    return this.channelService.addUserToChannel(request);
  }
  removeUserFromChannel(
    request: RemoveUserFromChannelDto,
  ): Channel | Promise<Channel> | Observable<Channel> {
    console.log(request);
    return null;
  }
}
