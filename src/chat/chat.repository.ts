import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { ChatToDBDto } from './dto/relateDB/ChatToDB.dto'
@Injectable()
export class ChatRepository {
  constructor(private prisma: PrismaService) {}

  async getAllChat(userId: string, prisma: Tx = this.prisma) {
    const chats = await prisma.chats.findMany({
      where: {
        OR: [
          {
            senderId: userId,
          },
          {
            receiveId: userId,
          },
        ],
      },
      include: {
        thread: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (chats.length === 0) {
      return []
    }

    let latestThread = new Map()

    chats.map((chat) => {
      const thread = chat.thread
      if (thread.length === 0) {
        latestThread.set(chat.id, '')
      } else {
        const lastThread = thread.sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
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

    if (lastedThreadId.length === 0) {
      const final = await Promise.all(
        chats.map(async (chat) => {
          const userReceive = await prisma.users.findUnique({
            where: {
              id: chat.receiveId,
            },
          })

          return {
            ...chat,
            user: userReceive,
            lastedThread: null,
          }
        }),
      )

      return final
    } else {
      const final = await Promise.all(
        chats.map(async (chat) => {
          const userReceive = await prisma.users.findUnique({
            where: {
              id: chat.receiveId,
            },
          })
          let lastedThread = null
          if (latestThread.get(chat.id) !== '') {
            lastedThread = await prisma.threads.findUnique({
              where: {
                id: latestThread.get(chat.id),
              },
              include: {
                messages: true,
              },
            })
            console.log(lastedThread)
          }

          return {
            ...chat,
            user: userReceive,
            lastedThread,
          }
        }),
      )

      return final
    }
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
          replys: {
            include: {
              user: true,
              files: true,
              reactions: true,
              messages: true,
            },
          },
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
          user: userReceive,
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

    const threads = await Promise.all(
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
      threads,
    }
  }

  async createChat(chatToDB: ChatToDBDto, prisma: Tx = this.prisma) {
    const { receiveId, senderId, file, messages } = chatToDB
    let newMsg: any
    let newFile: any
    if (file !== undefined || messages !== undefined) {
      const chat = await prisma.chats.create({
        data: {
          receiveId: chatToDB.receiveId,
          user: {
            connect: {
              id: chatToDB.senderId,
            },
          },
        },
        include: {
          user: true,
        },
      })

      if (chat === null) return null

      const thread = await prisma.threads.create({
        data: {
          isReply: false,
          receiveId,
          chats: {
            connect: {
              id: chat.id,
            },
          },
        },
        include: {
          user: true,
          messages: true,
        },
      })
      if (messages && messages.message !== undefined) {
        newMsg = await prisma.messages.create({
          data: {
            threadId: thread.id,
            message: messages.message,
          },
        })
      }
      if (file !== undefined && file !== null) {
        newFile = file.map(async (file) => {
          return await prisma.files.create({
            data: {
              filename: file.fileName,
              size: file.size,
              path: file.path,
              threadId: thread.id,
            },
          })
        })
        if (!newFile) {
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              message: 'File error. Please check again',
            },
            HttpStatus.BAD_REQUEST,
          )
        }
      }

      return {
        ...chat,
        lastedThread: {
          ...thread,
          messages: newMsg,
          files: newFile,
        },
        type: 'chat',
      }
    }
  }

  async reqAddFriendHaveChat(
    chatId: string,
    receiveId: string,
    prisma: Tx = this.prisma,
  ) {
    const reqAddFriend = await prisma.chats.update({
      where: {
        id: chatId,
        receiveId,
      },
      data: {
        requestAdd: true,
      },
    })

    if (reqAddFriend === null) return null
    const sender = await prisma.users.findUnique({
      where: {
        id: reqAddFriend.senderId,
      },
    })

    return {
      ...reqAddFriend,
      user: sender,
    }
  }

  async reqAddFriend(
    receiveId: string,
    senderId: string,
    prisma: Tx = this.prisma,
  ) {
    const reqAddFriend = await prisma.chats.create({
      data: {
        requestAdd: true,
        receiveId,
        senderId,
      },
    })

    if (reqAddFriend === null) return null

    const sender = await prisma.users.findUnique({
      where: {
        id: senderId,
      },
    })

    return {
      ...reqAddFriend,
      user: sender,
    }
  }

  async unReqAddFriend(
    chatId: string,
    userId: string,
    prisma: Tx = this.prisma,
  ) {
    const chat = await prisma.chats.findUnique({
      where: {
        id: chatId,
      },
      include: {
        thread: true,
      },
    })

    if (chat?.thread.length === 0) {
      const unReqAddFriend = await prisma.chats.delete({
        where: {
          id: chatId,
        },
      })
      return unReqAddFriend
    } else {
      const unReqAddFriend = await prisma.chats.update({
        where: {
          id: chatId,
          senderId: userId,
        },
        data: {
          requestAdd: false,
        },
      })

      return unReqAddFriend
    }
  }

  async getFriendChatWaittingAccept(
    receiveId: string,
    userId: string,
    prisma: Tx = this.prisma,
  ) {
    const friendChatWaittingAccept = await prisma.chats.findFirst({
      where: {
        receiveId,
        senderId: userId,
        requestAdd: true,
      },
    })
    console.log(friendChatWaittingAccept)

    return friendChatWaittingAccept
  }

  async acceptAddFriend(
    chatId: string,
    userId: string,
    prisma: Tx = this.prisma,
  ) {
    const acceptAddFriend = await prisma.chats.update({
      where: {
        id: chatId,
        receiveId: userId,
      },
      data: {
        requestAdd: false,
        isFriend: true,
      },
    })

    const sender = await prisma.users.findUnique({
      where: {
        id: acceptAddFriend.senderId,
      },
    })

    return {
      ...acceptAddFriend,
      user: sender,
    }
  }

  async rejectAddFriend(
    chatId: string,
    userId: string,
    prisma: Tx = this.prisma,
  ) {
    const rejectAddFriend = await prisma.chats.update({
      where: {
        id: chatId,
        receiveId: userId,
      },
      data: {
        requestAdd: false,
      },
    })

    return rejectAddFriend
  }

  async whitelistFriendAccept(userId: string, prisma: Tx = this.prisma) {
    const whitelistFriendAccept = await prisma.chats.findMany({
      where: {
        OR: [
          {
            receiveId: userId,
          },
          {
            senderId: userId,
          },
        ],
        isFriend: true,
      },
    })

    const final = await Promise.all(
      whitelistFriendAccept.map(async (chat) => {
        const anotherId =
          chat.senderId === userId ? chat.receiveId : chat.senderId
        const userReceive = await prisma.users.findUnique({
          where: {
            id: anotherId,
          },
        })

        return {
          ...chat,
          user: userReceive,
        }
      }),
    )

    return final
  }

  async waitlistFriendAccept(userId: string, prisma: Tx = this.prisma) {
    const waitlistFriendAccept = await prisma.chats.findMany({
      where: {
        OR: [
          {
            receiveId: userId,
          },
          {
            senderId: userId,
          },
        ],
        requestAdd: true,
      },
    })

    const final = await Promise.all(
      waitlistFriendAccept.map(async (chat) => {
        const anotherId =
          chat.senderId === userId ? chat.receiveId : chat.senderId
        const userReceive = await prisma.users.findUnique({
          where: {
            id: anotherId,
          },
        })

        return {
          ...chat,
          user: userReceive,
        }
      }),
    )
    return final
  }

  async unfriend(chatId: string, prisma: Tx = this.prisma) {
    const unfriend = await prisma.chats.findUnique({
      where: {
        id: chatId,
      },
      include: {
        thread: true,
      },
    })

    if (unfriend?.thread.length === 0) {
      const unfriend = await prisma.chats.delete({
        where: {
          id: chatId,
        },
      })
      return unfriend
    } else {
      const unfriend = await prisma.chats.update({
        where: {
          id: chatId,
        },
        data: {
          isFriend: false,
          requestAdd: false,
        },
      })
      return unfriend
    }
  }
}
