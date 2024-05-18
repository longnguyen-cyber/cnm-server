import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cache } from 'cache-manager'
import { CommonService } from '../common/common.service'
import { ChannelType } from '../enums'
import { UserService } from '../user/user.service'
import { ChannelRepository } from './channel.repository'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'
import { UserOfChannel } from './dto/UserOfChannel.dto'

@Injectable()
export class ChannelService {
  constructor(
    private channelRepository: ChannelRepository,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {}

  async getAllChannel(userId: string) {
    const channelsCache = await this.cacheManager.get('channels')
    if (channelsCache) {
      const parsedCache = JSON.parse(channelsCache as any) as Array<any>

      const updatedChannels = await Promise.all(
        parsedCache.map(async (channel) => {
          const users = await Promise.all(
            channel.users.map(async (user) => {
              const newUser = await this.userService.searchUserById(user.id)
              return this.commonService.deleteField(
                {
                  ...newUser,
                  role: user.role,
                  createdAt: user.createdAt,
                },
                ['settings', 'chatIds'],
                ['createdAt']
              )
            })
          )
          return {
            ...channel,
            users,
          }
        })
      )

      const rs = updatedChannels.filter((channel) => {
        return channel.users.some((user) => user.id === userId)
      })

      if (rs) {
        return rs
      } else {
        return []
      }
    } else {
      return await this.getChannelsOfUser(userId)
    }
  }

  async getChannelById(channelId: string, userId: string) {
    const channelCache = await this.cacheManager.get(`channel-${channelId}`)
    if (channelCache) {
      console.log('cache hit channelId: ', channelId)
      const chanelParsed = JSON.parse(channelCache as any)
      if (chanelParsed.users.some((user) => user.id === userId)) {
        //update users
        const users = await Promise.all(
          chanelParsed.users.map(async (user) => {
            const newUser = await this.userService.searchUserById(user.id)
            return this.commonService.deleteField(
              {
                ...newUser,
                role: user.role,
                createdAt: user.createdAt,
              },
              ['settings', 'chatIds'],
              ['createdAt']
            )
          })
        )
        chanelParsed.users = users
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
          ['createdAt']
        )
        if (rs.threads) {
          rs.threads = rs.threads.map((thread) => {
            if (thread.files.length > 0) {
              thread.files = thread.files.map((file) => {
                file.size = this.commonService.convertToSize(file.size)
                return file
              })
            }
            return thread
          })
        }
        await this.cacheManager.set(
          `channel-${channelId}`,
          JSON.stringify(rs),
          {
            ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
          }
        )
        return rs
      }
    }
  }

  private async getChannelsOfUser(userId: string) {
    const rs = await this.channelRepository.getAllChannel(userId)
    const final = rs.map((channel) =>
      this.commonService.deleteField(channel, ['thread'])
    )
    await this.cacheManager.set('channels', JSON.stringify(final), {
      ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
    })
    return final
  }

  async getMembersOfChannel(channelId: string) {
    const memebers = await this.channelRepository.getMembersOfChannel(channelId)
    return this.commonService.deleteField(memebers, [])
  }
  async updatedCacheChannels(type: string = 'default', id?: string) {
    console.time('updateCacheChannels')

    if (type === ChannelType.CreateChannel) {
      //case for createChannel
      await this.getChannelsOfUser(id)
      console.log('cache channels updated: ', id)
    } else {
      const cacheChannels = await this.cacheManager.get('channels')
      const channels = JSON.parse(cacheChannels as any) as Array<any>
      if (type === ChannelType.DeleteChannel) {
        //case for deleteChannel
        const channelId = id
        const updatedChannel = channels.filter(
          (channel) => channel.id !== channelId
        )
        await this.cacheManager.set(
          'channels',
          JSON.stringify(updatedChannel),
          {
            ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
          }
        )
      } else {
        if (id) {
          //update all channels for user
          console.log('cache channels updated: ', id)
          await this.getChannelsOfUser(id)
        } else {
          console.log('cache channels updated: all')
          //update all channels for all user
          const newSetUserUpdate = new Set()
          channels.forEach((channel) => {
            newSetUserUpdate.add(channel.userCreated)
          })
          for (const user of newSetUserUpdate) {
            const rs = await this.channelRepository.getAllChannel(
              user as string
            )
            const final = rs.map((channel) =>
              this.commonService.deleteField(channel, ['thread'])
            )
            await this.cacheManager.set('channels', JSON.stringify(final), {
              ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
            })
            console.log('cache channels updated: ', user)
          }
        }
      }
    }
    console.timeEnd('updateCacheChannels')
  }

  async updateCacheChannel(channelId: string, stoneId?: string, type?: string) {
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
          stoneId
        )) as any

      //check is update or create
      const threadExist = chanelParsed.threads.find(
        (thread) => thread.id === threadNew.id
      )

      if (threadNew.files.length > 0) {
        threadNew.files = threadNew.files.map((file) => {
          file.size = this.commonService.convertToSize(file.size)
          return file
        })
      }

      if (!threadExist) {
        if (type === 'delete') {
          console.log('delete')
          chanelParsed.threads = chanelParsed.threads.filter(
            (thread) => thread.stoneId !== stoneId
          )

          if (chanelParsed.threads.length === 0) {
            await this.cacheManager.del(`channel-${channelId}`)
            return true
          }
        } else {
          console.log('create')
          chanelParsed.threads.push(
            this.commonService.deleteField(
              threadNew,
              ['userId', 'thread'],
              ['createdAt']
            )
          )
        }
      } else {
        //missing case recall and delete
        //update

        console.log('update')
        chanelParsed.threads = chanelParsed.threads.map((thread) => {
          if (thread.id === threadNew.id) {
            return this.commonService.deleteField(
              threadNew,
              ['userId', 'thread'],
              ['createdAt']
            )
          }
          return thread
        })
      }

      await this.cacheManager.set(
        `channel-${channelId}`,
        JSON.stringify(chanelParsed),
        {
          ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
        }
      )
    } else {
      // thread system
      console.log('system thread')
      const channel = await this.channelRepository.getChannelById(channelId)

      if (!channel) {
        return null
      } else {
        const rs = this.commonService.deleteField(
          channel,
          ['userId', 'thread'],
          ['createdAt']
        )
        if (rs.threads) {
          rs.threads = rs.threads.map((thread) => {
            if (thread.files.length > 0) {
              thread.files = thread.files.map((file) => {
                file.size = this.commonService.convertToSize(file.size)
                return file
              })
            }
            return thread
          })
        }
        await this.cacheManager.set(
          `channel-${channelId}`,
          JSON.stringify(rs),
          {
            ttl: this.configService.get<number>('CHANNEL_EXPIRED'),
          }
        )
        return rs
      }
    }
    console.log('cache channel update channelId: ', channelId)
  }

  async createChannel(channelCreateDto: ChannelCreateDto) {
    const channelCreate = await this.channelRepository.createChannel(
      channelCreateDto
    )
    if (channelCreate.error) {
      return channelCreate
    } else {
      return this.commonService.deleteField(
        channelCreate,
        ['userId', 'thread'],
        ['createdAt']
      )
    }
  }

  async updateChannel(
    channelId: string,
    userId: string,
    channelUpdateDto: ChannelUpdateDto,
    stoneId: string
  ) {
    const updated = await this.channelRepository.updateChannel(
      channelId,
      userId,
      channelUpdateDto,
      stoneId
    )
    if (updated.error) {
      return updated
    }
    const findChannel = await this.channelRepository.getChannelById(
      channelId,
      userId
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
      ['createdAt']
    )
  }

  async deleteChannel(channelId: string, userId: string) {
    const deleted = await this.channelRepository.deleteChannel(
      channelId,
      userId
    )
    if (deleted.error) {
      return deleted
    } else {
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
    stoneId: string
  ) {
    const rs = await this.channelRepository.addUserToChannel(
      channelId,
      users,
      personAddedId,
      stoneId
    )

    if (rs.error) {
      return rs
    }
    const channel = await this.channelRepository.getChannelById(channelId)

    return this.commonService.deleteField(
      { ...channel, lastedThread: channel.threads[channel.threads.length - 1] },
      ['userId', 'thread', 'threads'],
      ['createdAt']
    )
  }

  async removeUserFromChannel(
    channelId: string,
    userId: string,
    personRemovedId: string,
    stoneId: string
  ) {
    const remove = await this.channelRepository.removeUserFromChannel(
      channelId,
      userId,
      personRemovedId,
      stoneId
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
        ['createdAt']
      )
    }
  }

  async updateRoleUserInChannel(
    channelId: string,
    user: UserOfChannel,
    userId: string,
    stoneId: string
  ) {
    const updated = await this.channelRepository.updateRoleUserInChannel(
      channelId,
      user,
      userId,
      stoneId
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
        ['createdAt']
      )
    }
  }

  async leaveChannel(
    channelId: string,
    userId: string,
    stoneId: string,
    transferOwner?: string
  ) {
    const leaveChannel = await this.channelRepository.leaveChannel(
      channelId,
      userId,
      stoneId,
      transferOwner
    )

    if (leaveChannel.error) {
      return leaveChannel
    } else {
      const channel = await this.channelRepository.getChannelById(channelId)

      return this.commonService.deleteField(
        {
          ...channel,
          lastedThread: channel.threads[channel.threads.length - 1],
        },
        ['userId', 'thread', 'threads'],
        ['createdAt']
      )
    }
  }

  // async messageReturn(
  //   userId: string,
  //   type: string,
  //   users?: any[],
  //   transferOwner?: string,
  // ) {
  //   let user
  //   if (
  //     type === ChannelType.UpdateRoleUserInChannel ||
  //     type === ChannelType.LeaveChannel
  //   ) {
  //     user = await this.userService.searchUserById(userId)
  //   }

  //   let usersAdded: any[] = []
  //   let transferOwnerUser: any
  //   let oldOwner: any
  //   if (transferOwner) {
  //     oldOwner = await this.userService.searchUserById(userId)
  //     transferOwnerUser = await this.userService.searchUserById(transferOwner)
  //   } else {
  //     if (type === ChannelType.AddUserToChannel && users !== undefined) {
  //       for (const u of users) {
  //         const id = u.id
  //         const user = await this.userService.searchUserById(id)
  //         usersAdded.push(user)
  //       }
  //     } else if (type === ChannelType.RemoveUserFromChannel) {
  //       user = await this.userService.searchUserById(userId)
  //     }
  //   }

  //   const messages = {
  //     message:
  //       transferOwner !== undefined
  //         ? `Nhóm sẽ được chuyển giao cho ${transferOwnerUser.name} bởi ${oldOwner.name}`
  //         : type === ChannelType.UpdateRoleUserInChannel
  //           ? `Quyền của ${user.name} vừa được cập nhật`
  //           : type === ChannelType.UpdateChannel
  //             ? `Nhóm vừa được cập nhật`
  //             : type === ChannelType.LeaveChannel
  //               ? `Người dùng ${user.name} vừa rời khỏi nhóm`
  //               : type === ChannelType.AddUserToChannel
  //                 ? usersAdded.map((user) => user.name).join(', ') +
  //                   ` vừa được thêm vào nhóm}`
  //                 : `${user.name} vừa bị xóa khỏi nhóm`,
  //   }
  //   return messages
  // }
}
