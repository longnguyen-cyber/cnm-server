import { Injectable } from '@nestjs/common';
import {
  CommonService,
  FileCreateDto,
  ReactCreateDto,
  Thread,
  ThreadCondition,
  ThreadToDBDto,
} from '@app/common';
import { ThreadRepository } from './thread.repository';
import { MessageCreateDto } from './dto/messageCreate.dto';
import { ReactToDBDto } from './dto/relateDB/reactToDB.dto';

@Injectable()
export class ThreadService {
  constructor(
    private threadRepository: ThreadRepository,
    private commonService: CommonService,
  ) {}

  async createThread(threadDto: ThreadToDBDto): Promise<any> {
    const threadToDb = this.compareToCreateThread(
      threadDto.messages,
      threadDto.file,
      threadDto.react,
      threadDto.senderId,
      threadDto.receiveId,
      threadDto.channelId,
      threadDto.chatId,
    );
    // if (threadDto.file) {
    //   const limitFileSize = this.limitFileSize(threadDto.file.size);
    //   console.log(limitFileSize);
    //   if (limitFileSize) {
    //     return {
    //       success: false,
    //       message: 'File size is too large',
    //       errors: 'File size is too large',
    //       thread: null,
    //     };
    //   }
    // }

    const thread = await this.threadRepository.createThread(threadToDb);
    return {
      thread,
    };
  }

  async updateThread(updateThread: ThreadCondition): Promise<any> {
    const threadToDb = this.compareToCreateThread(
      updateThread.messages,
      updateThread.file,
      updateThread.react,
      updateThread.senderId,
      updateThread.receiveId,
      updateThread.channelId,
      updateThread.chatId,
      updateThread.threadId,
    );

    const thread = await this.threadRepository.updateThread(threadToDb);
    // const limitFileSize = this.limitFileSize(fileCreateDto.size);

    // if (!limitFileSize) {
    //   return {
    //     success: false,
    //     message: 'File size is too large',
    //     errors: 'File size is too large',
    //     thread: null,
    //   };
    // }
    return {
      thread,
    };
  }

  async deleteThread(threadId: string): Promise<any> {
    const thread = await this.threadRepository.deleteThread(threadId);
    return {
      thread,
    };
  }

  async recallSendThread(threadId: string, senderId: string): Promise<any> {
    const thread = await this.threadRepository.recallSendThread(
      threadId,
      senderId,
    );
    return {
      thread,
    };
  }

  async createReplyThread(threadDto: ThreadCondition): Promise<any> {
    const thread = this.compareToCreateThread(
      threadDto.messages,
      threadDto.file,
      threadDto.react,
      threadDto.senderId,
      null,
      null,
      null,
      threadDto.threadId,
    );

    // if (fileCreateDto) {
    //   const limitFileSize = this.limitFileSize(fileCreateDto.size);
    //   console.log(limitFileSize);

    //   if (limitFileSize) {
    //     return {
    //       success: false,
    //       message: 'File size is too large',
    //       errors: 'File size is too large',
    //       thread: null,
    //     };
    //   }
    // }
    await this.threadRepository.createReplyThread(thread);
    return {
      success: true,
      message: 'Create reply thread success',
      errors: null,
      thread: null,
    };
  }

  async addReact(
    react: string,
    quantity: number,
    threadId: string,
    senderId: string,
  ): Promise<Thread | any> {
    const reactToDb = this.compareToCreateReact(
      react,
      quantity,
      threadId,
      senderId,
    );
    const thread = await this.threadRepository.addReact(reactToDb);
    return {
      thread,
    };
  }

  async removeReact(threadId: string, senderId: string): Promise<Thread | any> {
    const reactToDb = this.compareToCreateReact(null, null, threadId, senderId);
    const thread = await this.threadRepository.removeReact(reactToDb);
    return {
      thread,
    };
  }

  async getAllThread(type: string, id: string): Promise<any> {
    const threads = await this.threadRepository.getAllThread(type, id);
    const newThreads = threads.map((item) => {
      // const newAvatar = this.commonService.transferFileToURL(
      //   req,
      //   item.user?.avatar,
      // );
      delete item.user?.password;
      return {
        ...item,
        files: item.files.map((file) => {
          return {
            ...file,
            size: this.convertToMB(file.size),
            // path: this.commonService.transferFileToURL(req, file.path),
          };
        }),
        user: {
          ...item.user,
          // avatar: newAvatar,
        },
        replys:
          item.replys.length > 0 &&
          item.replys.map((rep) => {
            delete rep.user?.password;
            return {
              ...rep,
              user: {
                ...rep.user,
                // avatar: this.commonService.transferFileToURL(
                //   req,
                //   rep.user.avatar,
                // ),
              },
              files: rep.files.map((file) => {
                return {
                  ...file,
                  size: this.convertToMB(file.size),
                  // path: this.commonService.transferFileToURL(req, file.path),
                };
              }),
            };
          }),
      };
    });
    return newThreads;
  }

  async getThreadById(threadId: string) {
    const thread = await this.threadRepository.getThreadById(threadId);
    return thread;
  }

  async getThreadByReceiveId(receiveId: string): Promise<Thread | any> {
    const thread = await this.threadRepository.getThreadByReceiveId(receiveId);
    return thread;
  }

  async findByText(text: string): Promise<Thread | any> {
    const findByText = await this.threadRepository.findByText(text);
    const data = findByText.map((item) => {
      return {
        ...item,
      };
    });
    return data;
  }

  async findByDate(from: string, to?: string): Promise<Thread | any> {
    const threads = await this.threadRepository.findByDate(from, to);
    return threads;
  }

  private compareToCreateThread(
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto,
    react?: ReactCreateDto,
    senderId?: string,
    receiveId?: string,
    channelId?: string,
    chatId?: string,
    threadId?: string,
  ): ThreadToDBDto {
    return {
      messages: messageCreateDto,
      file: fileCreateDto
        ? {
            ...fileCreateDto,
          }
        : null,
      react,
      senderId,
      receiveId,
      channelId,
      chatId,
      threadId,
    };
  }

  private compareToCreateReact(
    react?: string,
    quantity?: number,
    threadId?: string,
    userId?: string,
  ): ReactToDBDto {
    return {
      react: react,
      quantity,
      threadId,
      userId,
    };
  }

  private convertDateToDB(date: string) {
    const convert = new Date(date);
    const year = convert.getFullYear();
    const month =
      convert.getMonth() + 1 < 10
        ? `0${convert.getMonth() + 1}`
        : convert.getMonth() + 1;

    const day = convert.getDate();

    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }

  private convertToMB = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return mb.toFixed(2);
  };

  private limitFileSize = (bytes: number) => {
    const fileSize = bytes / 1024 / 1024; // MB
    if (fileSize > 10) {
      return true;
    }
    return false;
  };
  transformFile(file) {
    return {
      ...file,
      size: this.convertToMB(file.size),
    };
  }

  transformUser(req, user) {
    return {
      ...user,
      avatar: this.commonService.transferFileToURL(req, user.avatar),
    };
  }

  transformReply(req, reply) {
    return {
      ...reply,
      user: this.transformUser(req, reply.user),
      files: reply.files.map((file) => this.transformFile(file)),
    };
  }

  transformThread(req, thread) {
    return {
      ...thread,
      files: thread.files.map((file) => this.transformFile(file)),
      user: this.transformUser(req, thread.user),
      replys: thread.replys.map((reply) => this.transformReply(req, reply)),
    };
  }
}
