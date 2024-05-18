import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Tx } from '../common/common.type'
import { PrismaService } from '../prisma/prisma.service'
import { EmojiToDBDto } from './dto/relateDB/emojiToDB.dto'
import { ThreadToDBDto } from './dto/relateDB/threadToDB.dto'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class ThreadRepository {
  constructor(private prisma: PrismaService) {}

  async createThread(threadToDB: ThreadToDBDto, prisma: Tx = this.prisma) {
    const messages = threadToDB.messages
    const replyId = threadToDB.replyId
    const mentions = threadToDB.mentions ?? []

    let replyTo: any
    if (replyId) {
      replyTo = await prisma.threads.findUnique({
        where: {
          stoneId: replyId,
        },
      })
      if (!replyTo) {
        return false
      }
    }
    let threadId = ''
    let newThread: any
    if (!threadToDB || !threadToDB.senderId) {
      return false
    }
    if (threadToDB.chatId === undefined || threadToDB.receiveId === null) {
      if (threadToDB.channelId === undefined) {
        //send for myself(my cloud)
        const exist = await prisma.threads.findUnique({
          where: {
            stoneId: threadToDB.stoneId,
          },
        })
        if (exist) {
          return false
        }

        newThread = await prisma.threads.create({
          data: {
            stoneId: threadToDB.stoneId,
            clouds: {
              connect: {
                id: threadToDB.cloudId,
              },
            },
            user: {
              connect: {
                id: threadToDB.senderId,
              },
            },
          },
        })
        await prisma.clouds.update({
          where: {
            id: threadToDB.cloudId,
          },
          data: {
            updatedAt: new Date(),
          },
        })

        threadId = newThread.id
      } else {
        //send for channel
        const channelExist = await prisma.channels.findUnique({
          where: {
            id: threadToDB.channelId,
          },
        })
        if (!channelExist) {
          return false
        }
        if (replyId) {
          const existingThread = await prisma.threads.findUnique({
            where: { stoneId: threadToDB.replyId },
          })

          if (!existingThread) {
            return false
          }
          newThread = await prisma.threads.create({
            data: {
              mentions,
              isReply: true,
              stoneId: threadToDB.stoneId,
              user: {
                connect: {
                  id: threadToDB.senderId,
                },
              },
              channel: {
                connect: {
                  id: threadToDB.channelId,
                },
              },
              replysTo: {
                connect: {
                  id: existingThread.id,
                },
              },
            },
          })
        } else {
          const exist = await prisma.threads.findUnique({
            where: {
              stoneId: threadToDB.stoneId,
            },
          })
          if (exist) {
            return false
          }
          newThread = await prisma.threads.create({
            data: {
              senderId: threadToDB.senderId,
              channelId: threadToDB.channelId,
              stoneId: threadToDB.stoneId,
              replyToId: replyId || null,
              mentions,
            },
          })
        }
        await prisma.channels.update({
          where: {
            id: threadToDB.channelId,
          },
          data: {
            timeThread: new Date(),
          },
        })
        threadId = newThread.id
      }
    } else {
      //send for chat
      const chatExist = await prisma.chats.findUnique({
        where: {
          id: threadToDB.chatId,
        },
      })

      if (!chatExist) {
        return false
      }
      if (replyId) {
        const existingThread = await prisma.threads.findUnique({
          where: { stoneId: threadToDB.stoneId },
        })

        if (existingThread) {
          return false
        }
        newThread = await prisma.threads.create({
          data: {
            isReply: true,
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
                id: existingThread.id,
              },
            },
          },
        })
      } else {
        const exist = await prisma.threads.findUnique({
          where: {
            stoneId: threadToDB.stoneId,
          },
        })
        if (exist) {
          return false
        }
        newThread = await prisma.threads.create({
          data: {
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
        })

        threadId = newThread.id
      }

      await prisma.chats.update({
        where: {
          id: threadToDB.chatId,
        },
        data: {
          timeThread: new Date(),
        },
      })
    }

    if (threadId) {
      if (messages && messages.message !== undefined) {
        await prisma.messages.create({
          data: {
            threadId,
            message: messages.message,
          },
        })
      }
      if (
        threadToDB.file !== undefined &&
        threadToDB.file !== null &&
        threadToDB.file.length > 0
      ) {
        await Promise.all(
          threadToDB.file.map(async (file) => {
            await prisma.files.create({
              data: {
                threadId,
                filename: file.filename,
                size: file.size,
                path: file.path,
              },
            })
          })
        )
      }

      return true
    }
    return false
  }

  async threadExists(
    stoneId: string,
    senderId: string,
    type: string,
    prisma: Tx = this.prisma
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
    prisma: Tx = this.prisma
  ): Promise<any> {
    const threadExist = await this.threadExists(stoneId, recallId, type, prisma)

    if (!threadExist) {
      return false
    } else {
      const recallSendThread = await prisma.threads.update({
        where: {
          stoneId,
        },
        data: {
          isRecall: true,
        },
        include: {
          files: true,
          messages: true,
        },
      })
      if (!recallSendThread) {
        return false
      }

      if (recallSendThread.files.length > 0) {
        await prisma.messages.create({
          data: {
            threadId: recallSendThread.id,
            message: 'Tin nhắn đã bị thu hồi',
          },
        })
      } else {
        await prisma.messages.update({
          where: {
            threadId: recallSendThread.id,
          },
          data: {
            message: 'Tin nhắn đã bị thu hồi',
          },
        })
      }

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
      await prisma.emojis.deleteMany({
        where: {
          threadId: recallSendThread.id,
        },
      })

      return true
    }
  }

  async updateThread(threadToDB: ThreadToDBDto, prisma: Tx = this.prisma) {
    const stoneId = threadToDB.stoneId
    const senderId = threadToDB.senderId
    const messages = threadToDB.messages
    const pin = threadToDB.pin
    const threadUpdate = await prisma.threads.findUnique({
      where: {
        stoneId,
      },
    })

    if (threadUpdate) {
      if (messages) {
        await prisma.messages.update({
          where: {
            threadId: threadUpdate.id,
          },
          data: {
            message: messages.message,
          },
        })
        return true
      } else {
        //pin thread
        await prisma.threads.update({
          where: {
            stoneId,
          },
          data: {
            pin: pin,
          },
        })

        return true
      }
    }
    return false
  }

  async deleteThread(
    stoneId: string,
    userDeleteId: string,
    type: string,
    prisma: Tx = this.prisma
  ) {
    const threadExist = await this.threadExists(
      stoneId,
      userDeleteId,
      type,
      prisma
    )

    if (!threadExist) {
      return false
    } else {
      const thread = await prisma.threads.findUnique({
        where: {
          stoneId,
        },
      })
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
      // Then, delete the thread
      const deleteThread = await prisma.threads.delete({
        where: {
          id: thread.id,
        },
      })

      if (!deleteThread) {
        return false
      }

      return true
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
    const emoji = await prisma.emojis.findFirst({
      where: {
        threadId: thread.id,
        emoji: emojiToDB.emoji,
      },
    })

    if (
      emoji &&
      emoji.quantity > 0 &&
      emoji.emoji === emojiToDB.emoji &&
      emoji.senderId === senderId
    ) {
      await prisma.emojis.update({
        where: {
          id: emoji.id,
        },
        data: {
          quantity: emoji.quantity + 1,
        },
      })
      return true
    } else {
      await prisma.emojis.create({
        data: {
          threadId: thread.id,
          senderId,
          emoji: emojiToDB.emoji,
          quantity: 1,
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
    const existEmoji = await prisma.emojis.findFirst({
      where: {
        threadId: thread.id,
        emoji: emojiToDB.emoji,
      },
    })
    if (!existEmoji) return false
    if (existEmoji.senderId !== senderId) return false
    if (existEmoji.quantity === 1) {
      await prisma.emojis.delete({
        where: {
          id: existEmoji.id,
        },
      })
      return true
    } else
      await prisma.emojis.update({
        where: {
          id: existEmoji.id,
        },
        data: {
          quantity: existEmoji.quantity - 1,
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
      })
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
