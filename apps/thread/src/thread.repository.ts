import { PrismaService, Tx, Res, ThreadToDBDto } from '@app/common';
import { Injectable } from '@nestjs/common';
import { ReactToDBDto } from './dto/relateDB/reactToDB.dto';

@Injectable()
export class ThreadRepository {
  constructor(private prisma: PrismaService) {}

  async createThread(
    threadToDB: ThreadToDBDto,
    prisma: Tx = this.prisma,
  ): Promise<Res> {
    const messages = threadToDB.messages;
    let threadId = '';
    let newThread: any;
    let newMsg: any;
    let newFile: any;
    let react: any;
    console.log(threadToDB);
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
      });
      threadId = newThread.id;
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
      });
      threadId = newThread.id;
    }

    const user = await prisma.users.findMany({
      where: {
        OR: [{ id: threadToDB.senderId }, { id: threadToDB.receiveId }],
      },
    });

    if (messages && messages.message !== undefined) {
      newMsg = await prisma.messages.create({
        data: {
          threadId,
          message: messages.message,
        },
      });
    } else if (threadToDB.react !== undefined) {
      react = await prisma.reactions.create({
        data: {
          threadId,
          userId: threadToDB.senderId,
          react: threadToDB.react.react,
          quantity: threadToDB.react.quantity,
        },
      });
    } else if (threadToDB.file !== undefined || threadToDB.file !== null) {
      // newFile = await prisma.files.create({
      //   data: {
      //     ...threadToDB.file,
      //     threadId,
      //   },
      // });
      if (!newFile) {
        return {
          success: false,
          message: 'Create thread failed',
          errors: 'Create file failed',
          data: null,
        };
      }
    }

    return {
      success: true,
      message: 'Create thread successfully',
      errors: '',
      data: {
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
        reacts: {
          ...react,
        },
      },
    };
  }

  async recallSendThread(
    threadId: string,
    senderId: string,
    prisma: Tx = this.prisma,
  ): Promise<Res> {
    const deleteThread = await prisma.threads.update({
      where: {
        id: threadId,
        senderId: senderId,
      },
      data: {
        isRecall: true,
      },
    });
    if (!deleteThread) {
      return {
        success: false,
        message: 'Recall thread failed',
        errors: 'Recall thread failed',
        data: null,
      };
    }
    const deleteMsg = await prisma.messages.deleteMany({
      where: {
        threadId: threadId,
      },
    });

    const deleteFile = await prisma.files.deleteMany({
      where: {
        threadId: threadId,
      },
    });

    const deleteReact = await prisma.reactions.deleteMany({
      where: {
        threadId: threadId,
      },
    });

    if (!deleteMsg && !deleteFile && !deleteReact && !deleteThread) {
      return {
        success: false,
        message: 'Delete thread failed',
        errors: 'Delete message, file, react and thread failed',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Delete thread successfully',
      errors: '',
      data: threadId,
    };
  }

  async createReplyThread(
    threadToDB: ThreadToDBDto,
    prisma: Tx = this.prisma,
  ): Promise<Res> {
    const messages = threadToDB.messages;
    const threadId = threadToDB.threadId;
    const senderId = threadToDB.senderId;
    let newMsg: any;
    let newFile: any;
    const newMsgReply = await prisma.threads.create({
      data: {
        senderId: senderId,
        isReply: true,
      },
    });
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
    });

    if (messages !== undefined) {
      newMsg = await prisma.messages.create({
        data: {
          threadId: newMsgReply.id,
          message: messages.message,
        },
      });
    } else if (threadToDB.file !== null) {
      // newFile = await prisma.files.create({
      //   data: {
      //     ...threadToDB.file,
      //     threadId: newMsgReply.id,
      //   },
      // });

      if (!newFile) {
        return {
          success: false,
          message: 'Create thread failed',
          errors: 'Create file failed',
          data: null,
        };
      }
    }

    return {
      success: true,
      message: 'Create thread successfully',
      errors: '',
      data: {
        messages: {
          ...newMsg,
        },
        files: {
          ...newFile,
        },
      },
    };
  }

  async updateThread(threadToDB: ThreadToDBDto, prisma: Tx = this.prisma) {
    const threadId = threadToDB.threadId;
    const messages = threadToDB.messages;

    const updateMsg = await prisma.messages.update({
      where: {
        threadId: threadId,
      },
      data: {
        message: messages.message,
      },
    });

    const updateFile = await prisma.files.update({
      where: {
        threadId: threadId,
      },
      data: {
        // ...threadToDB.file,
      },
    });

    const udpateReact = await prisma.reactions.update({
      where: {
        threadId: threadId,
      },
      data: {
        ...threadToDB.react,
      },
    });

    if (!updateMsg && !updateFile && !udpateReact) {
      return {
        success: false,
        message: 'Update thread failed',
        errors: 'Update message and file failed',
        data: null,
      };
    }

    if (updateFile || updateMsg) {
      await prisma.threads.update({
        where: {
          id: threadId,
        },
        data: {
          isEdited: true,
        },
      });
    }

    return {
      success: true,
      message: 'Update thread successfully',
      errors: '',
      data: {
        messages: {
          ...updateMsg,
        },
        files: {
          ...updateFile,
        },
        reacts: {
          ...udpateReact,
        },
      },
    };
  }

  async deleteThread(threadId: string, prisma: Tx = this.prisma) {
    const deleteMsg = await prisma.messages.deleteMany({
      where: {
        threadId: threadId,
      },
    });

    const deleteFile = await prisma.files.deleteMany({
      where: {
        threadId: threadId,
      },
    });

    const deleteReact = await prisma.reactions.deleteMany({
      where: {
        threadId: threadId,
      },
    });

    const deleteThread = await prisma.threads.delete({
      where: {
        id: threadId,
      },
    });

    if (!deleteMsg && !deleteFile && !deleteReact && !deleteThread) {
      return {
        success: false,
        message: 'Delete thread failed',
        errors: 'Delete message, file, react and thread failed',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Delete thread successfully',
      errors: '',
      data: null,
    };
  }

  async addReact(reactToDB: ReactToDBDto, prisma: Tx = this.prisma) {
    const threadId = reactToDB.threadId;
    const userId = reactToDB.userId;
    const react = await prisma.reactions.findUnique({
      where: {
        threadId,
        userId,
      },
    });
    console.log(react);

    if (react) {
      await prisma.reactions.update({
        where: {
          threadId: threadId,
          userId: userId,
        },
        data: {
          quantity: reactToDB.quantity,
        },
      });

      return {
        success: true,
        message: 'Update react successfully',
        errors: '',
      };
    } else {
      await prisma.reactions.create({
        data: {
          threadId: threadId,
          userId: userId,
          react: reactToDB.react,
          quantity: reactToDB.quantity,
        },
      });
    }

    return {
      success: true,
      message: 'Create react successfully',
      errors: '',
    };
  }

  async removeReact(reactToDB: ReactToDBDto, prisma: Tx = this.prisma) {
    const threadId = reactToDB.threadId;
    const userId = reactToDB.userId;

    await prisma.reactions.delete({
      where: {
        userId: userId,
        threadId: threadId,
      },
    });

    return {
      success: true,
      message: 'Delete react successfully',
      errors: '',
    };
  }
  async getAllThread(type: string, id: string, prisma: Tx = this.prisma) {
    let threads: any;
    if (type === 'channelId') {
      threads = await prisma.threads.findMany({
        where: {
          isReply: false,
          channelId: id,
        },
        include: {
          messages: true,
          user: true,
          files: true,
          reactions: true,
          replys: true,
        },
      });
    } else if (type === 'chatId') {
      threads = await prisma.threads.findMany({
        where: {
          isReply: false,
          chatId: id,
        },
        include: {
          messages: true,
          user: true,
          files: true,
          reactions: true,
          replys: true,
        },
      });
    }

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
        });
        return {
          ...thread,
          replys: replys,
        };
      }),
    );

    return threadsHaveReply;
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
    });

    return threads;
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
    });

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
    });

    return {
      ...thread,
      replys: replys,
    };
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
    });

    return threads;
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
    });

    return threads;
  }
}
