/* eslint-disable prettier/prettier */
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ChannelRepository {
  constructor(private prisma: PrismaService) {}

  async getAllChannel(prisma: Tx = this.prisma) {
    const channels = await prisma.channels.findMany({
      include: {
        users: true,
      },
    })

    const final = await Promise.all(
      channels.map(async (channel) => {
        const userCreated = await prisma.users.findUnique({
          where: {
            id: channel.userCreated,
          },
        })
        channel.users.map((user) => {
          delete user.password
        })
        delete userCreated.password
        return {
          ...channel,
          userCreated,
        }
      }),
    )

    return final
  }

  async getChannelById(id: string, prisma: Tx = this.prisma) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: id,
      },
      include: {
        thread: true,
      },
    })

    const getAllMessageOfThread = async (threadId: string) => {
      const thread = await prisma.threads.findUnique({
        where: {
          id: threadId,
        },
        include: {
          messages: true,
        },
      })
      return thread
    }

    const getAllFileOfThread = async (threadId: string) => {
      const thread = await prisma.threads.findUnique({
        where: {
          id: threadId,
        },
        include: {
          files: true,
        },
      })
      return thread
    }

    const threads = channel.thread

    const newThread = await Promise.all(
      threads.map(async (thread) => {
        const threads = await getAllMessageOfThread(thread.id)
        const messages = threads?.messages
        const files = await getAllFileOfThread(thread.id)
        const filesThread = files?.files
        return {
          ...thread,
          messages,
          files: filesThread,
        }
      }),
    )

    return {
      ...channel,
      thread: newThread,
    }
  }

  async createChannel(
    ChannelCreateDto: ChannelCreateDto,
    prisma: Tx = this.prisma,
  ) {
    const users = await prisma.users.findMany()
    const newChannel = await prisma.channels.create({
      data: {
        name: ChannelCreateDto.name,
        isPublic: ChannelCreateDto.isPublic,
        userCreated: ChannelCreateDto.userCreated,
      },
    })

    if (newChannel && ChannelCreateDto.isPublic) {
      await prisma.channels.update({
        where: {
          id: newChannel.id,
        },
        data: {
          userId: {
            set: users.map((user) => user.id),
          },
        },
      })
    } else if (newChannel && !ChannelCreateDto.isPublic) {
      await prisma.channels.update({
        where: {
          id: newChannel.id,
        },
        data: {
          userId: {
            set: [ChannelCreateDto.userCreated],
          },
        },
      })
    }

    return {
      success: true,
      message: 'Create channel successfully',
      errors: ' ',
      data: newChannel,
    }
  }

  async updateChannel(
    id: string,
    channelUpdateDto: ChannelUpdateDto,
    prisma: Tx = this.prisma,
  ) {
    const rs = await prisma.channels.update({
      where: {
        id: id,
      },
      data: {
        ...channelUpdateDto,
      },
    })
    return rs
  }

  async deleteChannel(id: string, prisma: Tx = this.prisma) {
    await prisma.channels.delete({
      where: {
        id: id,
      },
    })

    return {
      success: true,
      message: 'Delete channel successfully',
      errors: '',
    }
  }

  async addUserToChannel(
    channelId: string,
    users: string[],
    prisma: Tx = this.prisma,
  ) {
    const add = await prisma.channels.update({
      where: {
        id: channelId,
      },
      data: {
        userId: {
          push: users.map((user) => user),
        },
      },
    })
    if (add) {
      return await prisma.channels.findUnique({
        where: {
          id: channelId,
        },
        include: {
          users: true,
        },
      })
    }
  }

  async removeUserFromChannel(
    channelId: string,
    userId: string,
    prisma: Tx = this.prisma,
  ) {
    const channel = await prisma.channels.findUnique({
      where: {
        id: channelId,
      },
    })

    const users = channel?.userId.filter((user) => user !== userId)

    await prisma.channels.update({
      where: {
        id: channelId,
      },
      data: {
        userId: {
          set: users,
        },
      },
    })
  }
}
