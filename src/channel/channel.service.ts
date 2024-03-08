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
    if (!channel) {
      return null
    } else {
      return this.commonService.deleteField(
        channel,
        ['userId', 'thread'],
        ['updatedAt'],
      )
    }
  }

  async createChannel(channelCreateDto: ChannelCreateDto, userId?: string) {
    const channelCreate =
      await this.channelRepository.createChannel(channelCreateDto)
    const findChannel = await this.channelRepository.getChannelById(
      channelCreate,
      userId,
    )

    return this.commonService.deleteField(
      findChannel,
      ['userId', 'thread'],
      ['updatedAt'],
    )
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
    const findChannel = await this.channelRepository.getChannelById(
      updated,
      userId,
    )

    return this.commonService.deleteField(
      findChannel,
      ['userId', 'thread'],
      ['updatedAt'],
    )
  }

  async deleteChannel(channelId: string, userId: string) {
    return this.commonService.deleteField(
      this.channelRepository.deleteChannel(channelId, userId),
      ['userId'],
    )
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

    return this.commonService.deleteField(added, [
      'userId',
      'thread',
      'threads',
    ])
  }

  async removeUserFromChannel(
    channelId: string,
    userId: string,
    personRemovedId: string[],
  ) {
    const remove = await this.channelRepository.removeUsersFromChannel(
      channelId,
      userId,
      personRemovedId,
    )
    return this.commonService.deleteField(remove, ['thread', 'threads'])
  }

  async updateRoleUserInChannel(
    channelId: string,
    user: UserOfChannel,
    userId: string,
  ) {
    const updated = await this.channelRepository.updateRoleUserInChannel(
      channelId,
      user,
      userId,
    )
    return this.commonService.deleteField(updated, ['userId'])
  }

  async leaveChannel(
    channelId: string,
    userId: string,
    transferOwner?: string,
  ) {
    const leavteChannel = await this.channelRepository.leaveChannel(
      channelId,
      userId,
      transferOwner,
    )
    return this.commonService.deleteField(leavteChannel, [
      'userId',
      'thread',
      'threads',
    ])
  }
}
