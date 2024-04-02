/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { UserCreateDto } from './dto/userCreate.dto'
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

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
        chats: true,
      },
    })
    const final = await Promise.all(
      users.map(async (user) => {
        const channels = await findChannelOfUser(user.id, prisma)

        const chatIds = user.chats.map((chat) => ({
          id: chat.id,
          senderId: chat.senderId,
          receiveId: chat.receiveId,
        }))
        delete user.chats
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
    })
    return user
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
