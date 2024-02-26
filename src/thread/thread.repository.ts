import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Response, Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { ReactToDBDto } from './dto/relateDB/reactToDB.dto'
import { ThreadToDBDto } from './dto/relateDB/threadToDB.dto'

@Injectable()
export class ThreadRepository {
  constructor(private prisma: PrismaService) {}

  async createThread(threadToDB: ThreadToDBDto, prisma: Tx = this.prisma) {
    const messages = threadToDB.messages
    let threadId = ''
    let newThread: any
    let newMsg: any
    let newFile: any
    if (threadToDB.chatId === undefined || threadToDB.receiveId === null) {
      newThread = await prisma.threads.create({
        data: {
          senderId: threadToDB.senderId,
          channelId: threadToDB.channelId,
          isReply: false,
        },
        include: {
          user: true,
          messages: true,
        },
      })
      threadId = newThread.id
      await prisma.channels.update({
        where: {
          id: threadToDB.channelId,
        },
        data: {
          timeThread: new Date(),
        },
      })
    } else {
      newThread = await prisma.threads.create({
        data: {
          isReply: false,
          receiveId: threadToDB.receiveId,
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
      await prisma.chats.update({
        where: {
          id: threadToDB.chatId,
        },
        data: {
          timeThread: new Date(),
        },
      })
      threadId = newThread.id
    }

    const user = await prisma.users.findMany({
      where: {
        OR: [{ id: threadToDB.senderId }, { id: threadToDB.receiveId }],
      },
    })

    if (messages && messages.message !== undefined) {
      newMsg = await prisma.messages.create({
        data: {
          threadId,
          message: messages.message,
        },
      })
    } else if (threadToDB.file !== undefined || threadToDB.file !== null) {
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

    return {
      ...newThread,
      user: {
        ...user,
      },
      messages: {
        ...newMsg,
      },
      files: {
        ...newFile,
      },
    }
  }

  async recallSendThread(
    threadId: string,
    senderId: string,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const deleteThread = await prisma.threads.update({
      where: {
        id: threadId,
        senderId: senderId,
      },
      data: {
        isRecall: true,
      },
    })
    if (!deleteThread) {
      return {
        success: false,
        message: 'Recall thread failed',
        errors: 'Recall thread failed',
        data: null,
      }
    }
    const deleteMsg = await prisma.messages.deleteMany({
      where: {
        threadId: threadId,
      },
    })

    const deleteFile = await prisma.files.deleteMany({
      where: {
        threadId: threadId,
      },
    })

    const deleteReact = await prisma.reactions.deleteMany({
      where: {
        threadId: threadId,
      },
    })

    if (!deleteMsg && !deleteFile && !deleteReact && !deleteThread) {
      return {
        success: false,
        message: 'Delete thread failed',
        errors: 'Delete message, file, react and thread failed',
        data: null,
      }
    }

    return {
      success: true,
      message: 'Delete thread successfully',
      errors: '',
      data: threadId,
    }
  }

  async createReplyThread(
    threadToDB: ThreadToDBDto,
    prisma: Tx = this.prisma,
  ): Promise<any> {
    const messages = threadToDB.messages
    const threadId = threadToDB.threadId
    const senderId = threadToDB.senderId
    let newMsg: any
    let newFile: any
    const newMsgReply = await prisma.threads.create({
      data: {
        senderId: senderId,
        isReply: true,
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
      },
    })

    if (messages !== undefined) {
      newMsg = await prisma.messages.create({
        data: {
          threadId: newMsgReply.id,
          message: messages.message,
        },
      })
    } else if (threadToDB.file !== null) {
      newFile = threadToDB.file.map(async (file) => {
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

    return {
      messages: {
        ...newMsg,
      },
      files: {
        ...newFile,
      },
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
    threadId: string,
    senderId?: string,
    receiveId?: string,
    prisma: Tx = this.prisma,
  ) {
    let thread = null
    if (senderId) {
      thread = await prisma.threads.findFirst({
        where: {
          id: threadId,
          senderId,
        },
      })
    } else if (receiveId) {
      thread = await prisma.threads.findFirst({
        where: {
          id: threadId,
          receiveId,
        },
      })
    }

    if (thread) {
      const deleteMsg = await prisma.messages.deleteMany({
        where: {
          threadId: threadId,
        },
      })

      const deleteFile = await prisma.files.deleteMany({
        where: {
          threadId: threadId,
        },
      })

      const deleteReact = await prisma.reactions.deleteMany({
        where: {
          threadId: threadId,
        },
      })

      const deleteThread = await prisma.threads.delete({
        where: {
          id: threadId,
        },
      })

      if (!deleteMsg && !deleteFile && !deleteReact && !deleteThread) {
        return false
      }
      return true
    }
  }

  async addReact(reactToDB: ReactToDBDto, prisma: Tx = this.prisma) {
    const threadId = reactToDB.threadId
    const userId = reactToDB.userId
    const react = await prisma.reactions.findUnique({
      where: {
        threadId,
        userId,
      },
    })

    if (react) {
      await prisma.reactions.update({
        where: {
          threadId: threadId,
          userId: userId,
        },
        data: {
          quantity: reactToDB.quantity,
        },
      })

      return {
        success: true,
        message: 'Update react successfully',
        errors: '',
      }
    } else {
      await prisma.reactions.create({
        data: {
          threadId: threadId,
          userId: userId,
          react: reactToDB.react,
          quantity: reactToDB.quantity,
        },
      })
    }

    return {
      success: true,
      message: 'Create react successfully',
      errors: '',
    }
  }

  async removeReact(reactToDB: ReactToDBDto, prisma: Tx = this.prisma) {
    const threadId = reactToDB.threadId
    const userId = reactToDB.userId

    await prisma.reactions.delete({
      where: {
        userId: userId,
        threadId: threadId,
      },
    })

    return {
      success: true,
      message: 'Delete react successfully',
      errors: '',
    }
  }
  async getAllThread(type: string, id: string, prisma: Tx = this.prisma) {
    // let threads: any
    // if (type === 'channelId') {
    //   threads = await prisma.threads.findMany({
    //     where: {
    //       isReply: false,
    //       channelId: id,
    //     },
    //     include: {
    //       messages: true,
    //       user: true,
    //       files: true,
    //       reactions: true,
    //       replys: true,
    //     },
    //   })
    // } else if (type === 'chatId') {
    //   threads = await prisma.threads.findMany({
    //     where: {
    //       isReply: false,
    //       chatId: id,
    //     },
    //     include: {
    //       messages: true,
    //       user: true,
    //       files: true,
    //       reactions: true,
    //       replys: true,
    //     },
    //   })
    // }
    const threads = await prisma.threads.findMany({
      include: {
        messages: true,
        user: true,
        files: true,
        reactions: true,
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
            reactions: true,
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
        reactions: true,
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
        reactions: true,
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
