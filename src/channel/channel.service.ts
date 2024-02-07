import { Injectable } from '@nestjs/common'
import { ChannelRepository } from './channel.repository'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'

@Injectable()
export class ChannelService {
  constructor(private channelRepository: ChannelRepository) {}

  async getAllChannel(userId: string) {
    const channels = await this.channelRepository.getAllChannel(userId)
    return channels
  }

  async getChannelById(channelId: string, userId: string) {
    return this.channelRepository.getChannelById(channelId, userId)
  }

  async createChannel(channelCreateDto: ChannelCreateDto) {
    return this.channelRepository.createChannel(channelCreateDto)
  }

  async updateChannel(
    channelId: string,
    userId: string,
    channelUpdateDto: ChannelUpdateDto,
  ) {
    return this.channelRepository.updateChannel(
      channelId,
      userId,
      channelUpdateDto,
    )
  }

  async deleteChannel(channelId: string, userId: string) {
    return this.channelRepository.deleteChannel(channelId, userId)
  }

  async addUserToChannel(
    channelId: string,
    users: string[],
    personAddedId: string,
  ) {
    return this.channelRepository.addUserToChannel(
      channelId,
      users,
      personAddedId,
    )
  }
}
