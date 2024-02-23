import { Injectable } from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { ChatToDBDto } from './dto/relateDB/ChatToDB.dto'
@Injectable()
export class ChatRepository {
  constructor(private prisma: PrismaService) {}

  async getAllChat(userId: string, prisma: Tx = this.prisma) {
    const chats = await prisma.chats.findMany({
      where: {
        senderId: userId,
      },
      include: {
        user: true,
        thread: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (chats.length === 0) {
      return []
    }

    const lastedThreadId = chats.map((chat) => {
      const thread = chat.thread
      const lastThread = thread.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      )

      return lastThread[0].id
    })[0]

    const lastedThread = await prisma.threads.findUnique({
      where: {
        id: lastedThreadId,
      },
      include: {
        messages: true,
      },
    })

    const final = await Promise.all(
      chats.map(async (chat) => {
        const userReceive = await prisma.users.findUnique({
          where: {
            id: chat.receiveId,
          },
        })

        return {
          ...chat,
          userReceive,
        }
      }),
    )

    return final.map((chat) => {
      return {
        ...chat,
        lastedThread,
      }
    })
  }

  async getChatById(id: string, senderId: string, prisma: Tx = this.prisma) {
    const chat = await prisma.chats.findUnique({
      where: {
        id: id,
        senderId,
      },
      include: {
        thread: true,
        user: true,
      },
    })

    const getAllMessageOfThread = async (
      threadId: string,
      senderId: string,
      receiveId: string,
    ) => {
      const thread = await prisma.threads.findUnique({
        where: {
          id: threadId,
        },
        include: {
          messages: true,
          user: true,
          files: true,
          reactions: true,
        },
      })
      const receiveID = thread?.receiveId
      if (receiveID === null) return thread
      if (receiveID !== senderId) {
        const userReceive = await prisma.users.findUnique({
          where: {
            id: receiveId,
          },
        })
        return {
          ...thread,
          userReceive,
        }
      } else {
        const userSender = await prisma.users.findUnique({
          where: {
            id: senderId,
          },
        })
        return {
          ...thread,
          userSender,
        }
      }
    }

    if (chat === null) {
      return null
    }

    const thread = await Promise.all(
      chat.thread.map(async (thread) => {
        const threads = await getAllMessageOfThread(
          thread.id,
          senderId,
          chat.receiveId,
        )
        return threads
      }),
    ).then((rs) =>
      rs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    )

    return {
      ...chat,
      thread,
    }
  }

  async createChat(chatToDB: ChatToDBDto, prisma: Tx = this.prisma) {
    await prisma.chats.create({
      data: {
        receiveId: chatToDB.receiveId,
        user: {
          connect: {
            id: chatToDB.senderId,
          },
        },
      },
    })
    return true
  }

  async unfriend(chatId: string, userId: string, prisma: Tx = this.prisma) {
    const unfriend = await prisma.chats.delete({
      where: {
        senderId: userId,
        id: chatId,
      },
    })

    return unfriend !== null
  }
}
