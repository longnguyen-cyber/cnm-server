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

@Injectable()
export class ChannelRepository {
  constructor(private prisma: PrismaService) {}

  async getAllChannel(userId: string, prisma: Tx = this.prisma) {
    let channels: any

    //fix to anyone have in channel not only userCreated
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
    const getAllMessageOfThread = async (threadId: string) => {
      const thread = await prisma.threads.findUnique({
        where: {
          id: threadId,
        },
        include: {
          messages: true,
          files: true,
          emojis: true,
          user: true,
        },
      })
      return thread
    }

    const newThread = await Promise.all(
      channel.thread.map(async (thread) => {
        const threads = await getAllMessageOfThread(thread.id)
        const messages = threads?.messages
        const files = threads?.files
        const emojis = threads?.emojis
        const user = threads?.user
        return {
          ...thread,
          messages,
          files,
          emojis,
          user,
        }
      }),
    ).then((rs) =>
      rs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    )

    return {
      ...channel,
      users: channel.users.map((user: { id: string }) => {
        const u = userOfChannel.find((u) => u.id === user.id)
        return {
          ...user,
          ...u,
        }
      }),
      threads: newThread,
    }
  }

  async createChannel(
    ChannelCreateDto: ChannelCreateDto,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const members = ChannelCreateDto.members
    const newChannel = await prisma.channels.create({
      data: {
        name: ChannelCreateDto.name,
        isPublic: ChannelCreateDto.isPublic,
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
      return final.id
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
    prisma: Tx = this.prisma,
  ) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: id,
        userCreated: userId,
      },
    })

    if (!channel) {
      return { error: 'Channel not found' }
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
      return await this.handleSuccessful(rs, userId, 'updateChannel')
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
      const returnChannel = this.getChannelById(id, userId)
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

        return returnChannel
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

    const roleOfPersonAdded = this.getRoleOfPerson(channel, personAddedId)
    if (roleOfPersonAdded == null) {
      return { error: 'User not in channel' }
    }
    if (roleOfPersonAdded == 'MEMBER') {
      return { error: "You don't have permission to add user to this channel" }
    }

    if (this.checkUserExistInChannel(channel.users, users)) {
      return { error: 'Have some user in the channel' }
    }
    const add = await prisma.channels.update({
      where: {
        id: channelId,
        userCreated: personAddedId,
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
        'add',
        userAdded,
      )
    }
  }

  async removeUsersFromChannel(
    channelId: string,
    userId: string,
    usersRemoved: string[],
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

    const remainingUsers = this.getRemainingUsers(channel, usersRemoved)

    if (remainingUsers.length === channel.users.length) {
      return { error: 'User not found in the channel' }
    }

    const removed = await prisma.channels.update({
      where: { id: channelId },
      data: { users: remainingUsers, timeThread: new Date() },
    })

    if (removed) {
      return await this.handleSuccessful(
        channel,
        userId,
        'remove',
        usersRemoved,
      )
    }
  }

  async updateRoleUserInChannel(
    channelId: string,
    user: UserOfChannel,
    userId: string,
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

    console.log(userUpdate)

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
      return await this.handleSuccessful(channel, user.id, 'updateRole')
    }
  }

  async leaveChannel(
    channelId: string,
    userId: string,
    transferOwner?: string,
    prisma: Tx = this.prisma,
  ) {
    console.log(channelId, userId, transferOwner)
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
          users: remainingUsers.map((user: { id: string }) => {
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
          'leave',
          null,
          transferOwner,
        )
      }
    }
  }

  getRoleOfPerson(channel: any, userId: string) {
    const user = channel?.users.find(
      (user: { id: string }) => user.id === userId,
    )
    if (!user) {
      return null
    } else {
      return user.role
    }
  }

  getRemainingUsers(channel: any, usersRemoved: string[]) {
    return channel?.users?.filter(
      (user: { id: string }) => !usersRemoved.includes(user.id),
    )
  }

  checkUserExistInChannel(usersInChannel: any[], usersAdded: UserOfChannel[]) {
    const usersExistInChannel = usersInChannel.map(
      (user: { id: string }) => user.id,
    )
    const userAdded = usersAdded.map((user) => user.id)
    const check = usersExistInChannel?.some((id) => userAdded.includes(id))
    return !!check
  }

  async handleSuccessful(
    channel: any,
    userId: string,
    type: string,
    users?: string[],
    transferOwner?: string,
  ) {
    let user
    if ((type === 'updateRole' || type === 'leave') && channel) {
      user = await this.prisma.users.findUnique({
        where: {
          id: userId,
        },
      })
    }

    let usersChange: any[] = []
    if (transferOwner) {
      usersChange = await this.prisma.users.findMany({
        where: {
          id: {
            in: [userId, transferOwner],
          },
        },
      })
      console.log(usersChange)
    } else {
      if (users) {
        usersChange = await this.prisma.users.findMany({
          where: { id: { in: users } },
        })
      }
    }

    if (channel) {
      const stoneId = uuidv4()

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
              ? `Nhóm sẽ được chuyển giao cho ${usersChange[1].name} bởi ${usersChange[0].name}`
              : type === 'updateRole'
                ? `Quyền của ${user.name} vừa được cập nhật`
                : type === 'updateChannel'
                  ? `Nhóm vừa được cập nhật`
                  : type === 'leave'
                    ? `Người dùng ${user.name} vừa rời khỏi nhóm`
                    : usersChange.map((user) => user.name).join(', ') +
                      ` vừa được ${type == 'remove' ? 'xoá' : 'thêm vào nhóm'}`,
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
