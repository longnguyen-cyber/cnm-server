/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'
import { UserOfChannel } from './dto/UserOfChannel.dto'

@Injectable()
export class ChannelRepository {
  constructor(private prisma: PrismaService) {}

  async getAllChannel(userId: string, prisma: Tx = this.prisma) {
    const channels = await prisma.channels.findMany({
      where: {
        userCreated: userId,
      },
      include: {
        thread: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

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
          users,
        }
      }),
    )

    if (channels.length === 0) {
      return []
    } else {
      const lastedThreadId = channels
        .map((chat) => {
          const thread = chat.thread
          const lastThread = thread.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          )

          return lastThread
        })
        .flat()

      if (lastedThreadId.length !== 0) {
        const lastedThread = await prisma.threads.findUnique({
          where: {
            id: lastedThreadId[0].id,
          },
          include: {
            messages: true,
          },
        })
        return userOfChannel.map((channel) => {
          return {
            ...channel,
            lastedThread,
          }
        })
      } else {
        return userOfChannel
      }
    }
  }

  async getChannelById(id: string, userId: string, prisma: Tx = this.prisma) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: id,
        userCreated: userId,
      },
      include: {
        thread: true,
      },
    })

    if (!channel) {
      return null
    }

    // const userOfChannel = await Promise.all(
    //   channels.map(async (channel) => {
    //     const userOfChannel = channel.users
    //     const users = await prisma.users.findMany({
    //       where: {
    //         id: {
    //           in: userOfChannel.map((user: { id: string }) => user.id),
    //         },
    //       },
    //     })

    //     return {
    //       ...channel,
    //       users,
    //     }
    //   }),
    // )
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
          reactions: true,
        },
      })
      return thread
    }

    const newThread = await Promise.all(
      channel.thread.map(async (thread) => {
        const threads = await getAllMessageOfThread(thread.id)
        const messages = threads?.messages
        return {
          ...thread,
          messages,
        }
      }),
    ).then((rs) =>
      rs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
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
      thread: newThread,
    }
  }

  async createChannel(
    ChannelCreateDto: ChannelCreateDto,
    prisma: Tx = this.prisma,
  ): Promise<boolean> {
    const members = ChannelCreateDto.members
    const newChannel = await prisma.channels.create({
      data: {
        name: ChannelCreateDto.name,
        isPublic: ChannelCreateDto.isPublic,
        userCreated: ChannelCreateDto.userCreated,
      },
    })

    if (newChannel) {
      await prisma.channels.update({
        where: {
          id: newChannel.id,
        },
        data: {
          users: members.map((member) => {
            return {
              id: member,
              role: 'MEMBER',
            }
          }),
        },
      })
    }

    return true
  }

  async updateChannel(
    id: string,
    userId: string,
    channelUpdateDto: ChannelUpdateDto,
    prisma: Tx = this.prisma,
  ) {
    const rs = await prisma.channels.update({
      where: {
        id: id,
        userCreated: userId,
      },
      data: {
        ...channelUpdateDto,
      },
    })
    return rs
  }

  async deleteChannel(
    id: string,
    userId: string,
    prisma: Tx = this.prisma,
  ): Promise<boolean> {
    console.log('id', id)
    console.log('userId', userId)
    const channel = await prisma.channels.findUnique({
      where: {
        id: id,
        userCreated: userId,
      },
      include: {
        thread: true,
      },
    })
    console.log('channel', channel)
    const rs = await prisma.channels.delete({
      where: {
        id: id,
        userCreated: userId,
      },
    })

    //test faill
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

        await prisma.reactions.deleteMany({
          where: {
            threadId: thread.id,
          },
        })
      })

      return true
    }
    return false
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
        userCreated: personAddedId,
      },
    })

    //check users will be added with users in the channel have already
    const userInChannel = channel?.users.map((user: { id: string }) => user.id)
    const userAdded = users.map((user) => user.id)
    const check = userInChannel?.some((id) => userAdded.includes(id))
    // const check = userInChannel?.filter((id) => userAdded.includes(id)) return array of user in channel have already

    if (check) {
      throw new BadRequestException('Have some user in the channel')
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
      },
    })
    if (add) {
      return await prisma.channels.findUnique({
        where: {
          id: channelId,
        },
      })
    }
  }

  async removeUserFromChannel(
    channelId: string,
    usersRemoved: string[],
    prisma: Tx = this.prisma,
  ) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: channelId,
      },
    })

    if (!channel) {
      throw new NotFoundException('Channel not found')
    }

    const remainingUsers = channel?.users?.filter(
      (user: { id: string }) => !usersRemoved.includes(user.id),
    )

    const removed = await prisma.channels.update({
      where: {
        id: channelId,
      },
      data: {
        users: remainingUsers,
      },
    })

    if (removed) {
      return true
    }

    return false
  }

  //missing if user not in users
  async updateRoleUserInChannel(
    channelId: string,
    user: UserOfChannel,
    prisma: Tx = this.prisma,
  ) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: channelId,
      },
    })

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
      },
    })
    if (rs) {
      return true
    }

    return false
  }

  async leaveChannel(
    channelId: string,
    userId: string,
    transferOwner?: string,
    prisma: Tx = this.prisma,
  ) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: channelId,
      },
    })

    if (!channel) {
      throw new NotFoundException('Channel not found')
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
          userCreated: transferOwner,
          users: remainingUsers,
        },
      })
    } else {
      leave = await prisma.channels.update({
        where: {
          id: channelId,
        },
        data: {
          users: remainingUsers,
        },
      })
    }

    return leave ? true : false
  }
}
