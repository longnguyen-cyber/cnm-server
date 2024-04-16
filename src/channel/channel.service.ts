import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { ChannelRepository } from './channel.repository'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'
import { CommonService } from '../common/common.service'
import { UserOfChannel } from './dto/UserOfChannel.dto'
import { Cache } from 'cache-manager'
import { ConfigService } from '@nestjs/config'
import { threadId } from 'worker_threads'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class ChannelService {
  constructor(
    private channelRepository: ChannelRepository,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async getAllChannel(userId: string) {
    const channelsCache = await this.cacheManager.get('channels')
    if (channelsCache) {
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
      await this.cacheManager.set('channels', JSON.stringify(final), {
        ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
      })
      return final
    }
  }

  async getChannelById(channelId: string, userId: string) {
    const channelCache = await this.cacheManager.get(`channel-${channelId}`)
    if (channelCache) {
      console.log('cache hit channelId: ', channelId)
      const chanelParsed = JSON.parse(channelCache as any)
      if (chanelParsed.users.some((user) => user.id === userId)) {
        return chanelParsed
      } else {
        return null
      }
    } else {
      console.log('cache miss channelId: ', channelId)
      const channel = await this.channelRepository.getChannelById(channelId)

      if (!channel) {
        return null
      } else {
        const rs = this.commonService.deleteField(
          channel,
          ['userId', 'thread'],
          ['createdAt'],
        )
        rs.threads = rs.threads.map((thread) => {
          thread.files = thread.files.map((file) => {
            file.size = this.commonService.convertToSize(file.size)
            return file
          })
          return thread
        })
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

  async getMembersOfChannel(channelId: string) {
    const memebers = await this.channelRepository.getMembersOfChannel(channelId)
    return this.commonService.deleteField(memebers, [])
  }
  async getThread(threadId: string, senderId: string) {
    const thread = await this.channelRepository.getMessageOfThread(threadId)
    return this.commonService.deleteField(thread, [])
  }

  async updateCacheChannels(channelId: string) {
    const channelsCache = await this.cacheManager.get('channels')
    const channel = await this.channelRepository.getLastChannel(channelId)

    const channelsParsed = JSON.parse(channelsCache as any) as Array<any>
    const newChannels = [
      ...channelsParsed,
      this.commonService.deleteField(channel, ['userId', 'thread']),
    ]
    newChannels.sort((a, b) => {
      return new Date(b.timeThread).getTime() - new Date(a.timeThread).getTime()
    })
    await this.cacheManager.set('channels', JSON.stringify(newChannels), {
      ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
    })

    console.log('cache channels updated: ', channelId)
  }

  async updateCacheChannel(channelId: string, stoneId?: string) {
    if (stoneId) {
      //thread normal
      const cacheChannelId = await this.cacheManager.get(`channel-${channelId}`)
      if (!cacheChannelId) {
        return false
      }

      //get last thread
      const chanelParsed = JSON.parse(cacheChannelId as any)
      const threadNew =
        (await this.channelRepository.getMessageOfThreadByStoneId(
          stoneId,
        )) as any

      if (threadNew.files.length > 0) {
        threadNew.files = threadNew.files.map((file) => {
          file.size = this.commonService.convertToSize(file.size)
          return file
        })
      }
      //push thread to channel
      chanelParsed.threads.push(
        this.commonService.deleteField(
          threadNew,
          ['userId', 'thread'],
          ['createdAt'],
        ),
      )

      await this.cacheManager.set(
        `channel-${channelId}`,
        JSON.stringify(chanelParsed),
        {
          ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
        },
      )
    }
    console.log('cache channel update channelId: ', channelId)
  }

  async createChannel(channelCreateDto: ChannelCreateDto, userId?: string) {
    const channelCreate =
      await this.channelRepository.createChannel(channelCreateDto)
    if (channelCreate.error) {
      return channelCreate
    } else {
      await this.updateCacheChannels(channelCreate.id)
      return this.commonService.deleteField(
        channelCreate,
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
    const stoneId = uuidv4()
    const updated = await this.channelRepository.updateChannel(
      channelId,
      userId,
      channelUpdateDto,
      stoneId,
    )
    if (updated.error) {
      return updated
    }
    const findChannel = await this.channelRepository.getChannelById(
      channelId,
      userId,
    )
    if (findChannel) {
      await this.updateCacheChannel(channelId, stoneId)
    }

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
      await this.updateCacheChannels(userId)
      await this.cacheManager.del(`channel-${channelId}`)
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
    const stoneId = uuidv4()
    const rs = await this.channelRepository.addUserToChannel(
      channelId,
      users,
      personAddedId,
      stoneId,
    )

    if (rs.error) {
      return rs
    }
    const channel = await this.channelRepository.getChannelById(channelId)
    await this.updateCacheChannel(channelId, stoneId)

    return this.commonService.deleteField(
      { ...channel, lastedThread: channel.threads[channel.threads.length - 1] },
      ['userId', 'thread', 'threads'],
      ['createdAt'],
    )
  }

  async removeUserFromChannel(
    channelId: string,
    userId: string,
    personRemovedId: string,
  ) {
    const stoneId = uuidv4()
    const remove = await this.channelRepository.removeUsersFromChannel(
      channelId,
      userId,
      personRemovedId,
      stoneId,
    )
    if (remove.error) {
      return remove
    } else {
      const channel = await this.channelRepository.getChannelById(channelId)
      await this.updateCacheChannel(channelId, stoneId)

      return this.commonService.deleteField(
        {
          ...channel,
          lastedThread: channel.threads[channel.threads.length - 1],
        },
        ['userId', 'thread', 'threads'],
        ['createdAt'],
      )
    }
  }

  async updateRoleUserInChannel(
    channelId: string,
    user: UserOfChannel,
    userId: string,
  ) {
    const stoneId = uuidv4()
    const updated = await this.channelRepository.updateRoleUserInChannel(
      channelId,
      user,
      userId,
      stoneId,
    )

    if (updated.error) {
      return updated
    } else {
      const channel = await this.channelRepository.getChannelById(channelId)
      await this.updateCacheChannel(channelId, stoneId)

      return this.commonService.deleteField(
        {
          ...channel,
          lastedThread: channel.threads[channel.threads.length - 1],
        },
        ['userId', 'thread', 'threads'],
        ['createdAt'],
      )
    }
  }

  async leaveChannel(
    channelId: string,
    userId: string,
    transferOwner?: string,
  ) {
    const stoneId = uuidv4()
    const leavteChannel = await this.channelRepository.leaveChannel(
      channelId,
      userId,
      stoneId,
      transferOwner,
    )

    if (leavteChannel.error) {
      return leavteChannel
    } else {
      const channel = await this.channelRepository.getChannelById(channelId)
      await this.updateCacheChannel(channelId, stoneId)

      await this.updateCacheChannels(channel.userCreated)

      return this.commonService.deleteField(
        {
          ...channel,
          lastedThread: channel.threads[channel.threads.length - 1],
        },
        ['userId', 'thread', 'threads'],
        ['createdAt'],
      )
    }
  }
}
