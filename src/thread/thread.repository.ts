import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { EmojiToDBDto } from './dto/relateDB/emojiToDB.dto'
import { ThreadToDBDto } from './dto/relateDB/threadToDB.dto'

@Injectable()
export class ThreadRepository {
  constructor(private prisma: PrismaService) {}

  async createThread(threadToDB: ThreadToDBDto, prisma: Tx = this.prisma) {
    const messages = threadToDB.messages
    const replyId = threadToDB.replyId
    let replyTo: any
    if (replyId) {
      replyTo = await prisma.threads.findUnique({
        where: {
          id: replyId,
        },
      })
      if (!replyTo) {
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'Reply to thread not found',
        }
      }
    }

    let threadId = ''
    let newThread: any
    let newMsg: any
    let newFile: any
    let dataReturn: any

    if (threadToDB.chatId === undefined || threadToDB.receiveId === null) {
      newThread = await prisma.threads.create({
        data: {
          senderId: threadToDB.senderId,
          channelId: threadToDB.channelId,
          stoneId: threadToDB.stoneId,
          isReply: false,
          replyToId: replyId || null,
        },
        include: {
          user: true,
          messages: true,
        },
      })
      threadId = newThread.id
      const channel = await prisma.channels.update({
        where: {
          id: threadToDB.channelId,
        },
        data: {
          timeThread: new Date(),
        },
      })
      dataReturn = channel
    } else {
      if (replyId) {
        newThread = await prisma.threads.create({
          data: {
            isReply: false,
            stoneId: threadToDB.stoneId,
            user: {
              connect: {
                id: threadToDB.senderId,
              },
            },
            receiveId: threadToDB.receiveId,
            chats: {
              connect: {
                id: threadToDB.chatId,
              },
            },
            replysTo: {
              connect: {
                id: replyId,
              },
            },
          },
          include: {
            user: true,
            messages: true,
          },
        })
      } else {
        newThread = await prisma.threads.create({
          data: {
            isReply: false,
            receiveId: threadToDB.receiveId,
            stoneId: threadToDB.stoneId,
            user: {
              connect: {
                id: threadToDB.senderId,
              },
            },
            chats: {
              connect: {
                id: threadToDB.chatId,
              },
            },
          },
          include: {
            user: true,
            messages: true,
          },
        })
      }

      const chat = await prisma.chats.update({
        where: {
          id: threadToDB.chatId,
        },
        data: {
          timeThread: new Date(),
        },
      })
      dataReturn = chat
      threadId = newThread.id
    }

    if (messages && messages.message !== undefined) {
      newMsg = await prisma.messages.create({
        data: {
          threadId,
          message: messages.message,
        },
      })
    }
    if (threadToDB.file !== undefined && threadToDB.file !== null) {
      newFile = threadToDB.file.map(async (file) => {
        return await prisma.files.create({
          data: {
            threadId,
            filename: file.fileName,
            size: file.size,
            path: file.path,
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

    const sender = await prisma.users.findUnique({
      where: {
        id: threadToDB.senderId,
      },
    })

    return {
      thread: {
        ...newThread,

        messages: {
          ...newMsg,
        },
        user: sender,
        files: newFile,
      },
      dataReturn,
      sender,
    }
  }

  async threadExists(
    stoneId: string,
    senderId: string,
    type: string,
    prisma: Tx = this.prisma,
  ) {
    const threadExist = await prisma.threads.findUnique({
      where: {
        stoneId,
      },
    })
    if (!threadExist) {
      return false
    } else if (
      (type === 'chat' && threadExist.senderId !== senderId) ||
      (type === 'channel' && threadExist.senderId !== senderId)
    ) {
      return false
    }

    return true
  }
  async recallSendThread(
    stoneId: string,
    recallId: string,
    type: string,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const threadExist = await this.threadExists(stoneId, recallId, type, prisma)

    if (!threadExist) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: 'Thread not found',
      }
    } else {
      const recallSendThread = await prisma.threads.update({
        where: {
          stoneId,
        },
        data: {
          isRecall: true,
        },
      })
      if (!recallSendThread) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Recall thread failed',
        }
      }
      await prisma.messages.update({
        where: {
          threadId: recallSendThread.id,
        },
        data: {
          message: 'Tin nhắn đã bị thu hồi',
        },
      })

      await prisma.files.deleteMany({
        where: {
          threadId: recallSendThread.id,
        },
      })

      await prisma.emojis.deleteMany({
        where: {
          threadId: recallSendThread.id,
        },
      })
    }
  }

  async createReplyThread(
    threadToDB: ThreadToDBDto,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const messages = threadToDB.messages
    const threadId = threadToDB.threadId
    const senderId = threadToDB.senderId
    const files = threadToDB.file
    let newMsg: any
    let newFile: any
    let dataReturn: any
    const newMsgReply = await prisma.threads.create({
      data: {
        senderId: senderId,
      },
    })
    await prisma.threads.update({
      where: {
        id: threadId,
      },
      data: {
        replys: {
          connect: {
            id: newMsgReply.id,
          },
        },
        isReply: true,
      },
    })

    if (messages !== undefined) {
      newMsg = await prisma.messages.create({
        data: {
          threadId: newMsgReply.id,
          message: messages.message,
        },
      })
    }
    if (files !== null) {
      newFile = files.map(async (file) => {
        return await prisma.files.create({
          data: {
            filename: file.fileName,
            size: file.size,
            path: file.path,
            threadId: newMsgReply.id,
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

    if (!newMsgReply || !newMsg) {
      await prisma.threads.delete({
        where: {
          id: newMsgReply.id,
        },
      })

      await prisma.threads.update({
        where: {
          id: threadId,
        },
        data: {
          isReply: false,
        },
      })
    }
    if (threadToDB.chatId === undefined) {
      dataReturn = await prisma.channels.findUnique({
        where: {
          id: threadToDB.channelId,
        },
      })
    } else {
      dataReturn = await prisma.chats.findUnique({
        where: {
          id: threadToDB.chatId,
        },
      })
    }
    return {
      messages: {
        ...newMsg,
      },
      files: {
        ...newFile,
      },
      dataReturn,
    }
  }

  async updateThread(threadToDB: ThreadToDBDto, prisma: Tx = this.prisma) {
    const threadId = threadToDB.threadId
    const senderId = threadToDB.senderId
    const messages = threadToDB.messages
    const files = threadToDB.file
    const threadUpdate = await prisma.threads.findMany({
      where: {
        senderId,
        threadId,
      },
    })

    if (threadUpdate) {
      const updateMsg = await prisma.messages.update({
        where: {
          threadId,
        },
        data: {
          message: messages.message,
        },
      })
      let updateFile: any
      if (files) {
        updateFile = files.map(async (file) => {
          return await prisma.files.update({
            where: {
              threadId,
            },
            data: {
              filename: file.fileName,
              size: file.size,
              path: file.path,
            },
          })
        })
      }

      if (!updateMsg) {
        return false
      }

      if (updateFile || updateMsg) {
        await prisma.threads.update({
          where: {
            id: threadId,
          },
          data: {
            isEdited: true,
          },
        })
      }

      return {
        messages: {
          ...updateMsg,
        },
        files: {
          ...updateFile,
        },
      }
    }
  }

  async deleteThread(
    stoneId: string,
    userDeleteId: string,
    type: string,
    prisma: Tx = this.prisma,
  ) {
    const threadExist = await this.threadExists(
      stoneId,
      userDeleteId,
      type,
      prisma,
    )

    if (!threadExist) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: 'Thread not found',
      }
    } else {
      const thread = await prisma.threads.findUnique({
        where: {
          stoneId,
        },
      })
      // First, delete the messages associated with the thread
      await prisma.messages.deleteMany({
        where: {
          threadId: thread.id,
        },
      })

      // Then, delete the thread
      const deleteThread = await prisma.threads.delete({
        where: {
          id: thread.id,
        },
      })

      if (!deleteThread) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Delete thread failed',
        }
      }
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

      await prisma.emojis.deleteMany({
        where: {
          threadId: thread.id,
        },
      })
    }
  }

  async addEmoji(emojiToDB: EmojiToDBDto, prisma: Tx = this.prisma) {
    const stoneId = emojiToDB.stoneId
    const senderId = emojiToDB.senderId
    const thread = await prisma.threads.findUnique({
      where: {
        stoneId,
      },
    })
    const emoji = await prisma.emojis.findUnique({
      where: {
        threadId: thread.id,
        senderId,
      },
    })

    if (emoji) {
      await prisma.emojis.update({
        where: {
          threadId: thread.id,
          senderId,
        },
        data: {
          quantity: emojiToDB.quantity,
        },
      })
      return true
    } else {
      await prisma.emojis.create({
        data: {
          threadId: thread.id,
          senderId,
          emoji: emojiToDB.emoji,
          quantity: emojiToDB.quantity,
        },
      })
      return true
    }
  }

  async removeEmoji(emojiToDB: EmojiToDBDto, prisma: Tx = this.prisma) {
    const stoneId = emojiToDB.stoneId
    const senderId = emojiToDB.senderId
    const thread = await prisma.threads.findUnique({
      where: {
        stoneId,
      },
    })
    const existEmoji = await prisma.emojis.findUnique({
      where: {
        threadId: thread.id,
        senderId,
      },
    })
    if (!existEmoji) return false
    await prisma.emojis.delete({
      where: {
        senderId,
        threadId: thread.id,
      },
    })

    return true
  }
  async getAllThread(type: string, id: string, prisma: Tx = this.prisma) {
    const threads = await prisma.threads.findMany({
      include: {
        messages: true,
        user: true,
        files: true,
        emojis: true,
        replys: true,
      },
    })

    const threadsHaveReply = await Promise.all(
      threads.map(async (thread) => {
        const replys = await prisma.threads.findMany({
          where: {
            isReply: true,
            threadId: thread.id,
          },
          include: {
            messages: true,
            user: true,
            files: true,
            emojis: true,
          },
        })
        return {
          ...thread,
          replys: replys,
        }
      }),
    )

    return threadsHaveReply
  }

  async getThreadByReceiveId(receiveId: string, prisma: Tx = this.prisma) {
    const threads = await prisma.threads.findMany({
      where: {
        receiveId: receiveId,
      },
      include: {
        messages: true,
        user: true,
      },
    })

    return threads
  }

  async getThreadById(threadId: string, prisma: Tx = this.prisma) {
    const thread = await prisma.threads.findUnique({
      where: {
        id: threadId,
        isReply: false,
      },
      include: {
        messages: true,
        user: true,
        files: true,
        emojis: true,
        replys: true,
      },
    })

    const replys = await prisma.threads.findMany({
      where: {
        isReply: true,
        threadId: threadId,
      },
      include: {
        messages: true,
        user: true,
        files: true,
        emojis: true,
      },
    })

    return {
      ...thread,
      replys: replys,
    }
  }

  async findByText(text: string, prisma: Tx = this.prisma) {
    const threads = await prisma.threads.findMany({
      where: {
        messages: {
          message: {
            contains: text,
          },
        },
      },
      include: {
        messages: true,
        user: true,
      },
    })

    return threads
  }

  async findByDate(from: string, to?: string, prisma: Tx = this.prisma) {
    const threads = await prisma.threads.findMany({
      where: {
        messages: {
          createdAt: {
            gte: `${from}T00:00:00.000+00:00`,
            lte:
              to === undefined
                ? `${from}T23:59:59.000+00:00`
                : `${to}T23:59:59.000+00:00`,
          },
        },
      },
      include: {
        messages: true,
        user: true,
      },
    })

    return threads
  }
}
