import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { ChatToDBDto } from './dto/relateDB/ChatToDB.dto'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class ChatRepository {
  constructor(private prisma: PrismaService) {}

  async getAllChat(userId: string, prisma: Tx = this.prisma) {
    let chats = await prisma.chats.findMany({
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

    chats = chats.filter(
      (chat) => chat.thread.length > 0 || chat.isFriend === true,
    )

    let latestThread = new Map()

    chats.map((chat) => {
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

    if (lastedThreadId.length === 0) {
      const final = await Promise.all(
        chats.map(async (chat) => {
          const userRevice =
            chat.senderId === userId
              ? chat.receiveId // if user is sender, will return user receive
              : chat.senderId // if user is receiver, will return user sender
          const userReceive = await prisma.users.findUnique({
            where: {
              id: userRevice,
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
          const userRevice =
            chat.senderId === userId
              ? chat.receiveId // if user is sender, will return user receive
              : chat.senderId // if user is receiver, will return user sender
          const userReceive = await prisma.users.findUnique({
            where: {
              id: userRevice,
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
                files: true,
              },
            })
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

  async getLastChat(chatId: string, prisma: Tx = this.prisma) {
    const chat = await prisma.chats.findUnique({
      where: {
        id: chatId,
      },
      include: {
        thread: true,
      },
    })

    const lastedThreadId = chat.thread[chat.thread.length - 1].id
    const lastedThread = await prisma.threads.findUnique({
      where: {
        id: lastedThreadId,
      },
      include: {
        messages: true,
        files: true,
      },
    })
    return {
      ...chat,
      lastedThread,
    }
  }

  async getChatByUserId(
    senderId: string,
    receiveId: string,
    prisma: Tx = this.prisma,
  ) {
    const chat = await prisma.chats.findFirst({
      where: {
        OR: [
          {
            senderId,
            receiveId,
          },
          {
            senderId: receiveId,
            receiveId: senderId,
          },
        ],
      },
    })
    return chat ?? null
  }

  async getChatById(id: string, userId: string, prisma: Tx = this.prisma) {
    if (id === undefined || id === '') return null
    const chat = await prisma.chats.findUnique({
      where: {
        id,
      },
      include: {
        thread: true,
        user: true,
      },
    })
    if (chat === null) {
      return null
    }
    if (chat.senderId !== userId && chat.receiveId !== userId) {
      return null
    }
    const userRevice =
      chat.senderId === userId
        ? chat.receiveId // if user is sender, will return user receive
        : chat.senderId // if user is receiver, will return user sender
    const userReceive = await prisma.users.findUnique({
      where: {
        id: userRevice,
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
          emojis: true,
          replysTo: {
            include: {
              user: true,
              files: true,
              emojis: true,
              messages: true,
            },
          },
          replys: {
            include: {
              user: true,
              files: true,
              emojis: true,
              messages: true,
            },
          },
        },
      })
      if (thread === null) return null
      const receiveID = thread?.receiveId
      if (receiveID === null) return thread
      let threadReturn = null
      if (receiveID !== senderId) {
        const userReceive = await prisma.users.findUnique({
          where: {
            id: senderId,
          },
        })
        threadReturn = {
          ...thread,
          user: userReceive,
        }
      } else {
        const userSender = await prisma.users.findUnique({
          where: {
            id: receiveId,
          },
        })
        threadReturn = {
          ...thread,
          user: userSender,
        }
      }

      if (thread.replysTo === null) return threadReturn

      return threadReturn
    }

    if (chat.thread.length === 0)
      return {
        ...chat,
        user: userReceive,
        threads: [],
      }

    const threads = await Promise.all(
      chat.thread.map(async (thread) => {
        const threads = await getAllMessageOfThread(
          thread.id,
          chat.senderId,
          chat.receiveId,
        )

        return threads
      }),
    ).then((rs) =>
      rs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    )

    //find userReply of replysTo and replys
    const final = threads.map((thread) => {
      let replysTo
      if (thread.replysTo !== null) {
        const userOfReplysTo = threads.find(
          (t) => t.id === thread.replyToId,
        ).user
        replysTo = {
          ...thread.replysTo,
          user: userOfReplysTo,
        }
      }
      let replys
      if (thread.replys !== null) {
        replys = thread.replys.map((reply) => {
          const user = threads.find((t) => t.id === reply.threadId).user
          return {
            ...reply,
            user,
          }
        })
      }

      return {
        ...thread,
        replysTo,
        replys,
      }
    })

    return {
      ...chat,
      user: userReceive,
      threads: final,
    }
  }

  async chatExist(
    senderId: string,
    receiveId: string,
    prisma: Tx = this.prisma,
  ) {
    const chatExist = await prisma.chats.findFirst({
      where: {
        OR: [
          {
            senderId: senderId,
            receiveId: receiveId,
          },
          {
            senderId: receiveId,
            receiveId: senderId,
          },
        ],
      },
      include: {
        thread: true,
      },
    })

    return chatExist
  }

  async createChat(
    chatToDB: ChatToDBDto,
    stoneId: string,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const { receiveId, senderId, file, messages } = chatToDB
    let newMsg: any
    let newFile: any

    const chatExist = await this.chatExist(senderId, receiveId)
    if (chatExist) {
      return { error: 'Chat already exist', status: HttpStatus.BAD_REQUEST }
    } else {
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
            stoneId,
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
                filename: file.filename,
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
  }

  async reqAddFriendHaveChat(
    chatId: string,
    receiveId: string,
    prisma: Tx = this.prisma,
  ) {
    const reqAddExist = await prisma.chats.findUnique({
      where: {
        id: chatId,
      },
    })
    if (reqAddExist === null)
      return { error: 'Không tìm thấy chat', status: HttpStatus.NOT_FOUND }
    else if (reqAddExist.requestAdd === true)
      return { error: 'Đã gửi lời mời kết bạn', status: HttpStatus.BAD_REQUEST }

    const reqAddFriend = await prisma.chats.update({
      where: {
        id: chatId,
      },
      data: {
        requestAdd: true,
        userRequest:
          reqAddExist.senderId === receiveId
            ? reqAddExist.receiveId
            : reqAddExist.senderId,
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
    if (receiveId === senderId)
      return {
        error: 'Không thể tự kết bạn với chính mình',
        status: HttpStatus.BAD_REQUEST,
      }

    const reqAddExist = await this.chatExist(senderId, receiveId)

    if (reqAddExist && reqAddExist.requestAdd === true) {
      return { error: 'Đã gửi lời mời kết bạn', status: HttpStatus.BAD_REQUEST }
    }

    if (reqAddExist && reqAddExist.thread.length > 0) {
      this.reqAddFriendHaveChat(reqAddExist.id, receiveId)
    } else {
      const reqAddFriend = await prisma.chats.create({
        data: {
          requestAdd: true,
          receiveId,
          senderId,
          userRequest: senderId,
        },
      })
      if (reqAddFriend === null) return { error: 'Request add friend fail' }

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
  }

  async unReqAddFriend(
    chatId: string,
    userId: string,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const chat = await prisma.chats.findUnique({
      where: {
        id: chatId,
      },
      include: {
        thread: true,
      },
    })

    if (chat === null)
      return { error: 'Không tìm thấy chat', status: HttpStatus.NOT_FOUND }
    else {
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
          },
          data: {
            requestAdd: false,
          },
        })

        return unReqAddFriend
      }
    }
  }

  async getFriendChatWaittingAccept(
    receiveId: string,
    userId: string,
    prisma: Tx = this.prisma,
  ) {
    const friendChatWaittingAccept = await prisma.chats.findFirst({
      where: {
        OR: [
          {
            receiveId,
            senderId: userId,
          },
          {
            receiveId: userId,
            senderId: receiveId,
          },
        ],
      },
    })

    return friendChatWaittingAccept
  }

  async acceptAddFriend(
    chatId: string,
    userId: string,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const existing = await prisma.chats.findUnique({
      where: {
        id: chatId,
      },
    })
    if (!existing)
      return {
        error: 'Không tìm thấy chat',
        status: HttpStatus.NOT_FOUND,
      }

    if (existing.isFriend === true)
      return {
        error: 'Đã là bạn bè',
        status: HttpStatus.BAD_REQUEST,
      }
    if (existing.userRequest === userId) {
      return {
        error: 'Không thể tự kết bạn với chính mình',
        status: HttpStatus.BAD_REQUEST,
      }
    } else {
      const acceptAddFriend = await prisma.chats.update({
        where: {
          id: chatId,
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
  }

  async rejectAddFriend(
    chatId: string,
    userId: string,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const existing = await prisma.chats.findUnique({
      where: {
        id: chatId,
      },
      include: {
        thread: true,
      },
    })

    if (!existing)
      return {
        error: 'Không tìm thấy chat',
        status: HttpStatus.NOT_FOUND,
      }
    if (existing.userRequest === userId) {
      return {
        error: 'Không thể tự từ chối lời mời kết bạn',
        status: HttpStatus.BAD_REQUEST,
      }
    }
    if (existing.senderId !== userId && existing.receiveId !== userId) {
      return {
        error: 'Không tìm thấy',
        status: HttpStatus.BAD_REQUEST,
      }
    }

    if (existing.isFriend === true && existing.requestAdd === false)
      return {
        error: 'Đã từ chối lời mời kết bạn',
        status: HttpStatus.BAD_REQUEST,
      }
    if (existing.thread.length === 0) {
      const deleteFriend = await prisma.chats.delete({
        where: {
          id: chatId,
        },
      })
      return deleteFriend
    } else {
      const rejectAddFriend = await prisma.chats.update({
        where: {
          id: chatId,
        },
        data: {
          requestAdd: false,
          userRequest: null,
        },
      })

      return rejectAddFriend
    }
  }

  async listFriend(prisma: Tx = this.prisma) {
    const listFriend = await prisma.chats.findMany({
      where: {
        isFriend: true,
      },
      include: {
        user: true,
      },
    })

    return listFriend
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
    console.log(whitelistFriendAccept)
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

    const final = (
      await Promise.all(
        waitlistFriendAccept.map(async (chat) => {
          if (chat.userRequest !== userId) {
            const userReceive = await prisma.users.findUnique({
              where: {
                id: chat.senderId,
              },
            })
            return {
              ...chat,
              user: userReceive,
            }
          }
        }),
      )
    ).filter(Boolean)

    return final ?? []
  }

  async unfriend(chatId: string, prisma: Tx = this.prisma): Promise<any> {
    const unfriend = await prisma.chats.findUnique({
      where: {
        id: chatId,
      },
      include: {
        thread: true,
      },
    })

    if (unfriend === null)
      return {
        error: 'Không tìm thấy chat',
        status: HttpStatus.NOT_FOUND,
      }

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
          userRequest: null,
        },
      })
      return unfriend
    }
  }
}
