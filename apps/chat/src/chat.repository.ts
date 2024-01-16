import { Injectable } from '@nestjs/common';
import { ChatCreateDto, PrismaService, Tx } from '@app/common';
@Injectable()
export class ChatRepository {
  constructor(private prisma: PrismaService) {}

  async getAllChat(prisma: Tx = this.prisma) {
    // const chats = prisma.chats.findMany({
    //   include: {
    //     user: true,
    //     thread: true
    //   }
    // })

    // const getAllMessageOfThread = async (threadId: string) => {
    //   const thread = await prisma.threads.findUnique({
    //     where: {
    //       id: threadId
    //     },
    //     include: {
    //       user: true,
    //       messages: true
    //     }
    //   })
    //   return thread
    // }
    // const final = await Promise.all(
    //   (
    //     await chats
    //   ).map(async (chat) => {
    //     const thread = await Promise.all(
    //       chat.thread.map(async (thread) => {
    //         const threads = await getAllMessageOfThread(thread.id)
    //         return threads
    //       })
    //     )
    //     delete chat.senderId
    //     delete chat.receiveId
    //     return {
    //       ...chat,
    //       thread
    //     }
    //   })
    // )

    // return final
    return await this.prisma.chats.findMany({
      include: {
        user: true,
      },
    });
  }

  async getChatById(id: string, prisma: Tx = this.prisma) {
    const chat = await prisma.chats.findUnique({
      where: {
        id: id,
      },
      include: {
        user: true,
        thread: true,
      },
    });

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
        },
      });
      const receiveID = thread?.receiveId;
      if (receiveID === null) return thread;
      if (receiveID === senderId) {
        const userReceive = await prisma.users.findUnique({
          where: {
            id: receiveId,
          },
        });
        return {
          ...thread,
          user: userReceive,
        };
      } else {
        const userSender = await prisma.users.findUnique({
          where: {
            id: senderId,
          },
        });
        return {
          ...thread,
          user: userSender,
        };
      }
    };

    if (chat === null) {
      return null;
    }

    const thread = chat.thread.map(async (thread) => {
      if (chat.user === null) return thread;
      const threads = await getAllMessageOfThread(
        thread.id,
        chat.user.id,
        chat.receiveId,
      );
      return threads;
    });

    return {
      ...chat,
      thread,
    };
  }

  async createChat(chatToDB: ChatCreateDto, prisma: Tx = this.prisma) {
    await prisma.chats.create({
      data: {
        receiveId: chatToDB.receiveId,
        user: {
          connect: {
            id: chatToDB.senderId,
          },
        },
      },
    });
    return {
      success: true,
      message: 'Create chat successfully',
      errors: '',
    };
  }
}
