/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common'
import { AuthService } from '../auth/auth.service'
import { CommonService } from '../common/common.service'
import { UserCheck } from '../user/user.check'
import { ChannelRepository } from './channel.repository'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'

@Injectable()
export class ChannelService {
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
    private channelRepository: ChannelRepository,
    private userCheck: UserCheck,
  ) {}

  async getAllChannel(req) {
    const channels = await this.channelRepository.getAllChannel()
    return channels
  }

  async getChannelById(channelId: string) {
    return this.channelRepository.getChannelById(channelId)
  }

  async createChannel(channelCreateDto: ChannelCreateDto) {
    return this.channelRepository.createChannel(channelCreateDto)
  }

  async updateChannel(channelId: string, channelUpdateDto: ChannelUpdateDto) {
    return this.channelRepository.updateChannel(channelId, channelUpdateDto)
  }

  async deleteChannel(channelId: string) {
    return this.channelRepository.deleteChannel(channelId)
  }

  async addUserToChannel(channelId: string, users: string[]) {
    return this.channelRepository.addUserToChannel(channelId, users)
  }
}
