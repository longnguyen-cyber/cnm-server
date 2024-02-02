/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { UserCreateDto } from './dto/userCreate.dto'
import { TokenCreateDto } from './dto/tokenCreate.dto'
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findOneById(id: string, prisma: Tx = this.prisma) {
    const channels = await findChannelOfUser(id, prisma)
    const chatsOfUser = await prisma.chats.findMany({
      where: {
        OR: [{ senderId: id }, { receiveId: id }],
      },
      include: {
        thread: true,
        user: true,
      },
    })

    const chats = chatsOfUser.map(async (chat: any) => {
      const receiveID = chat.receiveId
      const senderID = chat.senderId
      if (receiveID === id) {
        const userOfChat = await prisma.users.findUnique({
          where: {
            id: senderID,
          },
        })
        const newChat = {
          ...chat,
          receiveId: senderID,
          user: userOfChat,
        }
        return newChat
      } else {
        const userOfChat = await prisma.users.findUnique({
          where: {
            id: receiveID,
          },
        })

        const newChat = {
          ...chat,
          user: userOfChat,
        }
        return newChat
      }
    })
    const user = await prisma.users.findUnique({
      where: {
        id: id,
      },
    })
    return {
      ...user,
      channels,
      chats,
    }
  }

  async findAll() {
    const prisma = this.prisma
    const users = await prisma.users.findMany()

    const final = await Promise.all(
      users.map(async (user) => {
        const channels = await findChannelOfUser(user.id, prisma)
        return {
          ...user,
          channels,
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
    })
    return user
  }

  async createUser(userCreateDto: UserCreateDto, prisma: Tx = this.prisma) {
    const user = await prisma.users.create({
      data: userCreateDto,
    })

    if (!user) {
      return null
    }

    return user
  }

  async updateUser(id: string, userUpdateDto: any, prisma: Tx = this.prisma) {
    const user = await prisma.users.update({
      where: {
        id: id,
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
}
const findChannelOfUser = async (userId: string, prisma: any) => {
  const channels = await prisma.channels.findMany({
    where: {
      userId: {
        has: userId,
      },
    },
  })
  return channels
}
