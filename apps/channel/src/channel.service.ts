/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { ChannelRepository } from './channel.repository';
import {
  AddUserToChannelDto,
  ChannelCreateDto,
  ChannelUpdateDto,
} from '@app/common';

@Injectable()
export class ChannelService {
  constructor(private channelRepository: ChannelRepository) {}

  async getAllChannels(): Promise<any> {
    const channels = await this.channelRepository.getAllChannel();
    return channels;
  }

  async getChannelById(channelId: string) {
    return this.channelRepository.getChannelById(channelId);
  }

  async createChannel(channelCreateDto: ChannelCreateDto): Promise<any> {
    return this.channelRepository.createChannel(channelCreateDto);
  }

  async updateChannel(channelUpdateDto: ChannelUpdateDto): Promise<any> {
    return this.channelRepository.updateChannel(channelUpdateDto.id, {
      name: channelUpdateDto.name,
      isPublic: channelUpdateDto.isPublic,
    });
  }

  async deleteChannel(channelId: string): Promise<any> {
    return this.channelRepository.deleteChannel(channelId);
  }

  async addUserToChannel(add: AddUserToChannelDto): Promise<any> {
    const { channelId, users } = add;
    return this.channelRepository.addUserToChannel(channelId, users);
  }
}
