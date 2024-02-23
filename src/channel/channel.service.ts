import { Injectable } from '@nestjs/common'
import { ChannelRepository } from './channel.repository'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'
import { CommonService } from '../common/common.service'
import { UserOfChannel } from './dto/UserOfChannel.dto'

@Injectable()
export class ChannelService {
  constructor(
    private channelRepository: ChannelRepository,
    private readonly commonService: CommonService,
  ) {}

  async getAllChannel(userId: string) {
    const channels = await this.channelRepository.getAllChannel(userId)
    return channels.map((channel) =>
      this.commonService.deleteField(channel, ['userId', 'thread']),
    )
  }

  async getChannelById(channelId: string, userId: string) {
    const channel = await this.channelRepository.getChannelById(
      channelId,
      userId,
    )

    return this.commonService.deleteField(channel, ['userId'])
  }

  async createChannel(channelCreateDto: ChannelCreateDto) {
    return this.channelRepository.createChannel(channelCreateDto)
  }

  async updateChannel(
    channelId: string,
    userId: string,
    channelUpdateDto: ChannelUpdateDto,
  ) {
    const updated = await this.channelRepository.updateChannel(
      channelId,
      userId,
      channelUpdateDto,
    )
    return this.commonService.deleteField(updated, ['userId'])
  }

  async deleteChannel(channelId: string, userId: string) {
    return this.channelRepository.deleteChannel(channelId, userId)
  }

  async addUserToChannel(
    channelId: string,
    users: UserOfChannel[],
    personAddedId: string,
  ) {
    const added = await this.channelRepository.addUserToChannel(
      channelId,
      users,
      personAddedId,
    )

    return this.commonService.deleteField(added, ['userId'])
  }

  async removeUserFromChannel(channelId: string, personRemovedId: string[]) {
    return this.channelRepository.removeUserFromChannel(
      channelId,
      personRemovedId,
    )
  }

  async updateRoleUserInChannel(channelId: string, user: UserOfChannel) {
    const updated = await this.channelRepository.updateRoleUserInChannel(
      channelId,
      user,
    )
    return this.commonService.deleteField(updated, ['userId'])
  }

  async leaveChannel(
    channelId: string,
    userId: string,
    transferOwner?: string,
  ) {
    return this.channelRepository.leaveChannel(channelId, userId, transferOwner)
  }
}
