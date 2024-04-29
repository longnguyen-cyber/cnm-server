/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { UserCreateDto } from './dto/userCreate.dto'
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async updateSetting(data: any, userId: string) {
    const settingExist = await this.prisma.settings.findUnique({
      where: {
        userId,
      },
    })

    if (settingExist) {
      return this.prisma.settings.update({
        where: {
          userId,
        },
        data,
      })
    }

    return null
  }

  async findOneById(id: string, prisma: Tx = this.prisma) {
    const user = await prisma.users.findUnique({
      where: {
        id: id,
      },
    })
    return user
  }

  async findAll(prisma: Tx = this.prisma) {
    const users = await prisma.users.findMany({
      include: {
        settings: true,
      },
    })
    const final = await Promise.all(
      users.map(async (user) => {
        const channels = await findChannelOfUser(user.id, prisma)
        const chats = await prisma.chats.findMany({
          where: {
            OR: [{ senderId: user.id }, { receiveId: user.id }],
          },
        })

        const chatIds = chats.map((chat) => ({
          id: chat.id,
          senderId: chat.senderId,
          receiveId: chat.receiveId,
        }))

        return {
          ...user,
          channels,
          chatIds,
        }
      }),
    )
    return final
  }

  async getUserByEmail(email: string, prisma: Tx = this.prisma) {
    const user = await prisma.users.findUnique({
      where: {
        email: email,
      },
      include: {
        settings: true,
      },
    })
    return user
  }

  async getCloudsByUserId(userId: string, prisma: Tx = this.prisma) {
    const clouds = await prisma.clouds.findUnique({
      where: {
        userId,
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
          user: true,
          files: true,
          emojis: true,
        },
      })
      if (thread === null) return null
      return thread
    }

    const threads = await Promise.all(
      clouds.thread.map(async (thread) => {
        const threads = await getAllMessageOfThread(thread.id)

        return threads
      }),
    )
    return {
      ...clouds,
      threads,
    }
  }

  async createUser(userCreateDto: UserCreateDto, prisma: Tx = this.prisma) {
    const user = await prisma.users.create({
      data: {
        ...userCreateDto,
        status: 'active',
      },
    })

    if (!user) {
      return null
    }

    await prisma.settings.create({
      data: {
        userId: user.id,
      },
    })

    await prisma.clouds.create({
      data: {
        userId: user.id,
      },
    })
    return user
  }

  async updateUser(id: string, userUpdateDto: any, prisma: Tx = this.prisma) {
    const userExist = await prisma.users.findUnique({
      where: {
        id,
      },
    })

    if (!userExist) {
      return null
    }
    const user = await prisma.users.update({
      where: {
        id,
      },
      data: {
        ...userUpdateDto,
      },
    })

    return user
  }

  async deleteUser(id: string, prisma: Tx = this.prisma) {
    const user = await prisma.users.delete({
      where: {
        id: id,
      },
    })
    return user
  }

  async findOneByEmail(email: string, prisma: Tx = this.prisma) {
    const user = await prisma.users.findUnique({
      where: {
        email: email,
      },
    })
    return user
  }

  async findOneByName(name: string, prisma: Tx = this.prisma) {
    const user = await prisma.users.findUnique({
      where: {
        name: name,
      },
    })
    return user
  }
}
const findChannelOfUser = async (userId: string, prisma: any) => {
  const channels = await prisma.channels.findMany({
    where: {
      users: {
        has: userId,
      },
    },
  })
  return channels
}
