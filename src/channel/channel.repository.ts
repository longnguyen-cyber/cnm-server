/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'

@Injectable()
export class ChannelRepository {
  constructor(private prisma: PrismaService) {}

  async getAllChannel(userId: string, prisma: Tx = this.prisma) {
    const channels = await prisma.channels.findMany({
      where: {
        userCreated: userId,
      },
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

    return channels
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
    )

    return {
      ...channel,
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
          userId: {
            set: members,
          },
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
    const rs = await prisma.channels.delete({
      where: {
        id: id,
        userCreated: userId,
      },
    })
    if (rs) {
      return true
    }
    return false
  }

  async addUserToChannel(
    channelId: string,
    users: string[],
    personAddedId: string,
    prisma: Tx = this.prisma,
  ) {
    const add = await prisma.channels.update({
      where: {
        id: channelId,
        userId: {
          has: personAddedId,
        },
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
