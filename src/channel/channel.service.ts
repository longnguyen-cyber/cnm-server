import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { ChannelRepository } from './channel.repository'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'
import { CommonService } from '../common/common.service'
import { UserOfChannel } from './dto/UserOfChannel.dto'
import { Cache } from 'cache-manager'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ChannelService {
  constructor(
    private channelRepository: ChannelRepository,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async getAllChannel(userId: string) {
    const channelsCache = await this.cacheManager.get(`channels-${userId}`)
    if (false) {
      const parsedCache = JSON.parse(channelsCache as any) as Array<any>

      const rs = parsedCache.map((channel) => {
        return channel.users.some((user) => user.id === userId)
      })
      if (rs) {
        return parsedCache
      } else {
        return []
      }
    } else {
      const rs = await this.channelRepository.getAllChannel(userId)
      const final = rs.map((channel) =>
        this.commonService.deleteField(channel, ['thread']),
      )
      await this.cacheManager.set(`channels-${userId}`, JSON.stringify(final), {
        ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
      })
      return final
    }
  }

  private async updateCacheChannels(userId: string) {
    const rs = await this.channelRepository.getAllChannel(userId)
    const final = rs.map((channel) =>
      this.commonService.deleteField(channel, ['thread']),
    )

    await this.cacheManager.set(`channels-${userId}`, JSON.stringify(final), {
      ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
    })

    console.log('cache channels update userId: ', userId)
  }

  async getChannelById(channelId: string, userId: string) {
    const channelCache = await this.cacheManager.get(`channel-${channelId}`)
    if (false) {
      console.log('cache hit channelId: ', channelId)
      const chanelParsed = JSON.parse(channelCache as any)
      if (chanelParsed.users.some((user) => user.id === userId)) {
        return chanelParsed
      } else {
        return null
      }
    } else {
      const channel = await this.channelRepository.getChannelById(
        channelId,
        userId,
      )

      if (!channel) {
        return null
      } else {
        const rs = this.commonService.deleteField(
          channel,
          ['userId', 'thread'],
          ['createdAt'],
        )
        await this.cacheManager.set(
          `channel-${channelId}`,
          JSON.stringify(rs),
          {
            ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
          },
        )
        return rs
      }
    }
  }
  async updateCacheChannel(channelId: string, userId: string) {
    const channel = await this.channelRepository.getChannelById(
      channelId,
      userId,
    )
    if (!channel) {
      return false
    }
    const rs = this.commonService.deleteField(
      channel,
      ['userId', 'thread'],
      ['createdAt'],
    )
    await this.cacheManager.set(`channel-${channelId}`, JSON.stringify(rs), {
      ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
    })
    console.log('cache channel update channelId: ', channelId)

    return true
  }

  async createChannel(channelCreateDto: ChannelCreateDto, userId?: string) {
    const channelCreate =
      await this.channelRepository.createChannel(channelCreateDto)
    if (channelCreate.error) {
      return channelCreate
    } else {
      const findChannel = await this.channelRepository.getChannelById(
        channelCreate,
        userId,
      )
      // if (findChannel) {
      //   findChannel.users.forEach(async (user) => {
      //     await this.updateCacheChannels(user.id)
      //   })
      //   await this.updateCacheChannel(channelCreate, userId)
      // }

      return this.commonService.deleteField(
        findChannel,
        ['userId', 'thread'],
        ['createdAt'],
      )
    }
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
    if (updated.error) {
      return updated
    }
    const findChannel = await this.channelRepository.getChannelById(
      channelId,
      userId,
    )

    return this.commonService.deleteField(
      {
        ...findChannel,
        lastedThread: findChannel.threads[findChannel.threads.length - 1],
      },
      ['userId', 'thread', 'threads'],
      ['createdAt'],
    )
  }

  async deleteChannel(channelId: string, userId: string) {
    const deleted = await this.channelRepository.deleteChannel(
      channelId,
      userId,
    )
    if (deleted.error) {
      return deleted
    } else {
      return this.commonService.deleteField(deleted, [
        'userId',
        'threads',
        'thread',
      ])
    }
  }

  async addUserToChannel(
    channelId: string,
    users: UserOfChannel[],
    personAddedId: string,
  ) {
    const rs = await this.channelRepository.addUserToChannel(
      channelId,
      users,
      personAddedId,
    )

    if (rs.error) {
      return rs
    }
    const channel = await this.channelRepository.getChannelById(channelId)

    return this.commonService.deleteField(
      { ...channel, lastedThread: channel.threads[channel.threads.length - 1] },
      ['userId', 'thread', 'threads'],
    )
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
    if (remove.error) {
      return remove
    } else {
      const channel = await this.channelRepository.getChannelById(channelId)
      return this.commonService.deleteField(
        {
          ...channel,
          lastedThread: channel.threads[channel.threads.length - 1],
        },
        ['userId', 'thread', 'threads'],
      )
    }
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
    if (updated.error) {
      return updated
    } else {
      const channel = await this.channelRepository.getChannelById(channelId)
      return this.commonService.deleteField(
        {
          ...channel,
          lastedThread: channel.threads[channel.threads.length - 1],
        },
        ['userId', 'thread', 'threads'],
      )
    }
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

    if (leavteChannel.error) {
      return leavteChannel
    } else {
      const channel = await this.channelRepository.getChannelById(channelId)
      return this.commonService.deleteField(
        {
          ...channel,
          lastedThread: channel.threads[channel.threads.length - 1],
        },
        ['userId', 'thread', 'threads'],
      )
    }
  }
}
