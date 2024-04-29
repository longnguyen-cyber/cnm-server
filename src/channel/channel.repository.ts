/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'
import { UserOfChannel } from './dto/UserOfChannel.dto'
import { v4 as uuidv4 } from 'uuid'
import { ChannelType } from '../enums'

@Injectable()
export class ChannelRepository {
  constructor(private prisma: PrismaService) {}

  async getAllChannel(userId: string, prisma: Tx = this.prisma) {
    let channels: any
    channels = await prisma.channels.findMany({
      include: {
        thread: true,
      },
      orderBy: {
        timeThread: 'desc',
      },
    })
    channels = channels.filter((channel) =>
      channel.users.some((user: { id: string }) => user.id === userId),
    )

    if (channels.length === 0) {
      const all = await prisma.channels.findMany({
        include: {
          thread: true,
        },
        orderBy: {
          timeThread: 'desc',
        },
      })

      channels = all.filter((channel) =>
        channel.users.some((user: { id: string }) => user.id === userId),
      )
    }
    const userOfChannel = await Promise.all(
      channels.map(async (channel) => {
        const userOfChannel = channel.users
        const users = await prisma.users.findMany({
          where: {
            id: {
              in: userOfChannel.map((user: { id: string }) => user.id),
            },
          },
        })

        return {
          ...channel,
          users: users.map((user) => {
            const role: any = userOfChannel.find(
              (u: { id: string; role: string }) => u.id === user.id,
            )
            return {
              ...user,
              role: role.role,
            }
          }),
        }
      }),
    )

    if (channels.length === 0) {
      return []
    } else {
      let latestThread = new Map()

      channels.map((chat) => {
        const thread = chat.thread
        if (thread.length === 0) {
          latestThread.set(chat.id, '')
        } else {
          const lastThread = thread.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          )

          latestThread.set(chat.id, lastThread[0].id)
        }
      })
      //check value of hashmap is empty or not
      let lastedThreadId = []
      latestThread.forEach((value, key) => {
        if (value !== '') {
          lastedThreadId.push({ id: value })
        }
      })
      if (lastedThreadId.length !== 0) {
        const final = await Promise.all(
          userOfChannel.map(async (channel) => {
            let lastedThread = null
            if (latestThread.get(channel.id) !== '') {
              lastedThread = await prisma.threads.findUnique({
                where: {
                  id: latestThread.get(channel.id),
                },
                include: {
                  messages: true,
                  files: true,
                },
              })
            }
            return {
              ...channel,
              lastedThread,
            }
          }),
        )

        return final
      } else {
        return userOfChannel.map((channel) => {
          return {
            ...channel,
            lastedThread: null,
          }
        })
      }
    }
  }

  async getChannelById(id: string, userId?: string, prisma: Tx = this.prisma) {
    let channel: any
    channel = await prisma.channels.findUnique({
      where: {
        id: id,
      },
      include: {
        thread: true,
      },
    })

    if (channel && userId) {
      //check user have in channel or not
      const isChannel = channel?.users.some(
        (user: { id: string }) => user.id === userId,
      )
      channel = isChannel ? channel : null
    }

    if (!channel) {
      return null
    }

    const userOfChannel = await prisma.users.findMany({
      where: {
        id: {
          in: channel.users.map((user: { id: string }) => user.id),
        },
      },
    })
    const newThread = await Promise.all(
      channel.thread.map(async (thread) => {
        const threads = await this.getMessageOfThread(thread.id)

        return threads
      }),
    ).then((rs) =>
      rs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    )

    const final = newThread.map((thread) => {
      let replysTo
      if (thread.replysTo !== null) {
        // const userOfReplysTo = newThread.find(
        //   (t) => t.id === thread.replyToId,
        // ).user
        replysTo = {
          ...thread.replysTo,
          // user: userOfReplysTo,
        }
      }

      return {
        ...thread,
        replysTo,
      }
    })

    return {
      ...channel,
      users: channel.users.map((user: { id: string }) => {
        const u = userOfChannel.find((u) => u.id === user.id)
        return {
          ...user,
          ...u,
        }
      }),
      threads: final,
    }
  }

  async getMessageOfThread(threadId: string) {
    const thread = await this.prisma.threads.findUnique({
      where: {
        id: threadId,
      },
      include: {
        messages: true,
        files: true,
        emojis: true,
        user: true,
        replysTo: {
          include: {
            user: true,
            files: true,
            emojis: true,
            messages: true,
          },
        },
      },
    })
    if (thread === null) return null

    return thread
  }

  async getMessageOfThreadByStoneId(stoneId: string) {
    const thread = await this.prisma.threads.findUnique({
      where: {
        stoneId,
      },
      include: {
        messages: true,
        files: true,
        emojis: true,
        user: true,
        replysTo: {
          include: {
            user: true,
            files: true,
            emojis: true,
            messages: true,
          },
        },
      },
    })
    if (thread === null) return null
    return thread
  }
  async getMembersOfChannel(id: string, prisma: Tx = this.prisma) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: id,
      },
    })

    if (!channel) {
      return []
    }

    const userOfChannel = await prisma.users.findMany({
      where: {
        id: {
          in: channel.users.map((user: { id: string }) => user.id),
        },
      },
    })

    return channel.users.map((user: { id: string; role: string }) => {
      const u = userOfChannel.find((u) => u.id === user.id)
      return {
        ...user,
        ...u,
      }
    })
  }

  async createChannel(
    ChannelCreateDto: ChannelCreateDto,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const members = ChannelCreateDto.members
    const newChannel = await prisma.channels.create({
      data: {
        name: ChannelCreateDto.name,
        userCreated: ChannelCreateDto.userCreated,
      },
    })

    if (newChannel) {
      const final = await prisma.channels.update({
        where: {
          id: newChannel.id,
        },
        data: {
          users: members.map((member) => {
            if (member === ChannelCreateDto.userCreated) {
              return {
                id: member,
                role: 'ADMIN',
              }
            } else
              return {
                id: member,
                role: 'MEMBER',
              }
          }),
        },
      })
      return final
    }
    return {
      error: 'Create channel failed',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    }
  }

  async updateChannel(
    id: string,
    userId: string,
    channelUpdateDto: ChannelUpdateDto,
    stoneId: string,
    prisma: Tx = this.prisma,
  ) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: id,
      },
    })

    if (!channel) {
      return { error: 'Channel not found' }
    }
    const roleOfPersonUpdate = this.getRoleOfPerson(channel, userId)

    if (
      channelUpdateDto.disableThread != null &&
      roleOfPersonUpdate === 'MEMBER'
    ) {
      return {
        error: "You don't have permission to disable thread to this channel",
      }
    }

    const rs = await prisma.channels.update({
      where: {
        id: id,
        userCreated: userId,
      },
      data: {
        ...channelUpdateDto,
        timeThread: new Date(),
      },
    })
    if (rs) {
      return await this.handleSuccessful(
        rs,
        userId,
        ChannelType.UpdateChannel,
        stoneId,
      )
    }
  }

  async deleteChannel(
    id: string,
    userId: string,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const channel = await prisma.channels.findUnique({
      where: {
        id: id,
      },
      include: {
        thread: true,
      },
    })

    if (!channel) {
      return { error: 'Channel not found', status: HttpStatus.NOT_FOUND }
    }

    const roleOfPersonDelete = this.getRoleOfPerson(channel, userId)

    if (roleOfPersonDelete === 'ADMIN') {
      const rs = await prisma.channels.delete({
        where: {
          id: id,
          userCreated: userId,
        },
      })

      if (rs) {
        await prisma.threads.deleteMany({
          where: {
            channelId: id,
          },
        })

        channel?.thread.map(async (thread) => {
          await prisma.messages.deleteMany({
            where: {
              threadId: thread.id,
            },
          })

          await prisma.files.deleteMany({
            where: {
              threadId: thread.id,
            },
          })

          await prisma.emojis.deleteMany({
            where: {
              threadId: thread.id,
            },
          })
        })

        return rs
      } else {
        return {
          error: 'Delete channel failed',
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        }
      }
    } else {
      return {
        error: "You don't have permission to delete this channel",
        status: HttpStatus.FORBIDDEN,
      }
    }
  }

  async addUserToChannel(
    channelId: string,
    users: UserOfChannel[],
    personAddedId: string,
    stoneId: string,
    prisma: Tx = this.prisma,
  ) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: channelId,
      },
    })
    if (!channel) {
      return { error: 'Channel not found' }
    }

    if (this.checkUserExistInChannel(channel.users, users)) {
      return { error: 'Have some user in the channel' }
    }

    const blockUser = channel.blockUser
    if (blockUser.length !== 0) {
      const userBlocked = users.map((user) => user.id)
      const check = blockUser.filter((user) => userBlocked.includes(user))
      if (check.length > 0) {
        return { error: 'Some user blocked', userBlocked: check }
      }
    }
    const add = await prisma.channels.update({
      where: {
        id: channelId,
      },
      data: {
        users: {
          push: users.map((user) => {
            return {
              id: user.id,
              role: user.role,
            }
          }),
        },
        timeThread: new Date(),
      },
    })

    if (add) {
      const userAdded = users.map((user) => user.id)
      return await this.handleSuccessful(
        channel,
        personAddedId,
        ChannelType.AddUserToChannel,
        stoneId,
        userAdded,
      )
    }
  }

  async removeUserFromChannel(
    channelId: string,
    userId: string,
    userRemoved: string,
    stoneId: string,
    prisma: Tx = this.prisma,
  ) {
    const channel = await prisma.channels.findUnique({
      where: { id: channelId },
    })

    if (!channel) {
      return { error: 'Channel not found' }
    }

    const roleOfPersonAdded = this.getRoleOfPerson(channel, userId)

    if (roleOfPersonAdded == 'MEMBER') {
      return {
        error: "You don't have permission to remove user to this channel",
      }
    }

    const remainingUsers = this.getRemainingUser(channel, userRemoved)

    if (remainingUsers.length === channel.users.length) {
      return { error: 'User not found in the channel' }
    }
    const blockUserCurrent = channel.blockUser
    const newBlockUser = [...blockUserCurrent, userRemoved]

    const removed = await prisma.channels.update({
      where: { id: channelId },
      data: {
        users: remainingUsers,
        blockUser: newBlockUser,
        timeThread: new Date(),
      },
    })

    if (removed) {
      return await this.handleSuccessful(
        channel,
        userId,
        ChannelType.RemoveUserFromChannel,
        stoneId,
        [userRemoved],
      )
    }
  }

  async updateRoleUserInChannel(
    channelId: string,
    user: UserOfChannel,
    userId: string,
    stoneId: string,
    prisma: Tx = this.prisma,
  ) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: channelId,
      },
    })

    if (!channel) {
      return { error: 'Channel not found' }
    }

    const roleOfPersonUpdate = this.getRoleOfPerson(channel, userId)

    if (roleOfPersonUpdate == 'MEMBER') {
      return {
        error: "You don't have permission to update user to this channel",
      }
    }
    if (!this.checkUserExistInChannel(channel.users, [user])) {
      return { error: 'User not in here' }
    }

    const userUpdate = channel.users.map((u: { id: string }) => {
      if (u.id === user.id) {
        return {
          ...u,
          role: user.role,
        }
      }
      return u
    })

    const rs = await prisma.channels.update({
      where: {
        id: channelId,
      },
      data: {
        users: userUpdate,
        timeThread: new Date(),
      },
    })
    if (rs) {
      return await this.handleSuccessful(
        channel,
        user.id,
        ChannelType.UpdateRoleUserInChannel,
        stoneId,
      )
    }
  }

  async leaveChannel(
    channelId: string,
    userId: string,
    stoneId: string,
    transferOwner?: string,
    prisma: Tx = this.prisma,
  ) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: channelId,
      },
    })

    if (!channel) {
      return {
        error: 'Channel not found',
        status: HttpStatus.NOT_FOUND,
      }
    }

    if (transferOwner) {
      const transfer = await prisma.users.findUnique({
        where: {
          id: transferOwner,
        },
      })

      if (!transfer) {
        return {
          error: 'User transfer not found',
          status: HttpStatus.NOT_FOUND,
        }
      }
    }
    const remainingUsers = channel?.users?.filter(
      (user: { id: string }) => user.id !== userId,
    )

    let leave = null
    if (userId === channel.userCreated) {
      leave = await prisma.channels.update({
        where: {
          id: channelId,
        },
        data: {
          timeThread: new Date(),
          userCreated: transferOwner,
          users: remainingUsers.map((user: { id: string; role: string }) => {
            if (user.id === transferOwner) {
              return {
                ...user,
                role: 'ADMIN',
              }
            }
            return user
          }),
        },
      })
    } else {
      leave = await prisma.channels.update({
        where: {
          id: channelId,
        },
        data: {
          timeThread: new Date(),

          users: remainingUsers,
        },
      })
    }

    if (leave) {
      if (leave.users.length === 0) {
        await prisma.channels.delete({
          where: {
            id: channelId,
          },
        })
        return leave
      } else {
        return await this.handleSuccessful(
          channel,
          userId,
          ChannelType.LeaveChannel,
          stoneId,
          null,
          transferOwner,
        )
      }
    }
  }

  private getRoleOfPerson(channel: any, userId: string) {
    const user = channel?.users.find(
      (user: { id: string }) => user.id === userId,
    )
    if (!user) {
      return null
    } else {
      return user.role
    }
  }

  private getRemainingUsers(channel: any, usersRemoved: string[]) {
    return channel?.users?.filter(
      (user: { id: string }) => !usersRemoved.includes(user.id),
    )
  }

  private getRemainingUser(channel: any, userRemoved: string) {
    return channel?.users?.filter(
      (user: { id: string }) => user.id !== userRemoved,
    )
  }

  private checkUserExistInChannel(
    usersInChannel: any[],
    usersAdded: UserOfChannel[],
  ) {
    const usersExistInChannel = usersInChannel.map(
      (user: { id: string }) => user.id,
    )
    const userAdded = usersAdded.map((user) => user.id)
    const check = usersExistInChannel?.some((id) => userAdded.includes(id))
    return !!check
  }

  private async handleSuccessful(
    channel: any,
    userId: string,
    type: string,
    stoneId?: string,
    users?: string[],
    transferOwner?: string,
  ) {
    let user
    if (
      (type === ChannelType.UpdateRoleUserInChannel ||
        type === ChannelType.LeaveChannel) &&
      channel
    ) {
      user = await this.prisma.users.findUnique({
        where: {
          id: userId,
        },
      })
    }

    let usersAdded: any[] = []
    let transferOwnerUser: any
    let oldOwner: any
    if (transferOwner) {
      oldOwner = await this.prisma.users.findUnique({
        where: {
          id: userId,
        },
      })
      transferOwnerUser = await this.prisma.users.findUnique({
        where: {
          id: transferOwner,
        },
      })
    } else {
      if (users) {
        usersAdded = await this.prisma.users.findMany({
          where: { id: { in: users } },
        })
      }
    }

    if (channel) {
      const thread = await this.prisma.threads.create({
        data: {
          channelId: channel.id,
          isReply: false,
          stoneId,
        },
        include: { user: true, messages: true },
      })
      const messages = await this.prisma.messages.create({
        data: {
          threadId: thread.id,
          message:
            transferOwner !== undefined
              ? `Nhóm sẽ được chuyển giao cho ${transferOwnerUser.name} bởi ${oldOwner.name}`
              : type === ChannelType.UpdateRoleUserInChannel
                ? `Quyền của ${user.name} vừa được cập nhật`
                : type === ChannelType.UpdateChannel
                  ? `Nhóm vừa được cập nhật`
                  : type === ChannelType.LeaveChannel
                    ? `Người dùng ${user.name} vừa rời khỏi nhóm`
                    : usersAdded.map((user) => user.name).join(', ') +
                      ` vừa được ${type == ChannelType.RemoveUserFromChannel ? 'xoá' : 'thêm vào nhóm'}`,
          type: 'system',
        },
      })

      return {
        ...channel,
        lastedThread: {
          ...thread,
          messages,
        },
      }
    }
  }
}
