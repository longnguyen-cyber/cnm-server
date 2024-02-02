import { Injectable } from '@nestjs/common'
import { CommonService } from '../common/common.service'
import { FileCreateDto } from './dto/fileCreate.dto'
import { MessageCreateDto } from './dto/messageCreate.dto'
import { ReactToDBDto } from './dto/relateDB/reactToDB.dto'
import { ThreadToDBDto } from './dto/relateDB/threadToDB.dto'
import { ThreadRepository } from './thread.repository'
import { ReactCreateDto } from './dto/reactCreate.dto'

@Injectable()
export class ThreadService {
  constructor(
    private threadRepository: ThreadRepository,
    private commonService: CommonService,
  ) {}

  async createThread(
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto,
    reactCreateDto?: ReactCreateDto,
    senderId?: string,
    receiveId?: string,
    channelId?: string,
    chatId?: string,
  ) {
    const threadToDb = this.compareToCreateThread(
      messageCreateDto,
      fileCreateDto,
      reactCreateDto,
      senderId,
      receiveId,
      channelId,
      chatId,
    )
    if (fileCreateDto) {
      const limitFileSize = this.limitFileSize(fileCreateDto.size)
      console.log(limitFileSize)
      if (limitFileSize) {
        return {
          success: false,
          message: 'File size is too large',
          errors: 'File size is too large',
          thread: null,
        }
      }
    }

    const thread = await this.threadRepository.createThread(threadToDb)
    return {
      thread,
    }
  }

  async updateThread(
    threadId: string,
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto,
    reactCreateDto?: ReactCreateDto,
    senderId?: string,
    receiveId?: string,
    channelId?: string,
    chatId?: string,
  ) {
    const threadToDb = this.compareToCreateThread(
      messageCreateDto,
      fileCreateDto,
      reactCreateDto,
      senderId,
      receiveId,
      channelId,
      chatId,
      threadId,
    )

    const thread = await this.threadRepository.updateThread(threadToDb)
    const limitFileSize = this.limitFileSize(fileCreateDto.size)

    if (!limitFileSize) {
      return {
        success: false,
        message: 'File size is too large',
        errors: 'File size is too large',
        thread: null,
      }
    }
    return {
      thread,
    }
  }

  async deleteThread(threadId: string) {
    const thread = await this.threadRepository.deleteThread(threadId)
    return {
      thread,
    }
  }

  async recallSendThread(threadId: string, senderId: string) {
    const thread = await this.threadRepository.recallSendThread(
      threadId,
      senderId,
    )
    return {
      thread,
    }
  }

  async createReplyThread(
    threadId: string,
    senderId?: string,
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto,
    reactCreateDto?: ReactCreateDto,
  ) {
    const thread = this.compareToCreateThread(
      messageCreateDto,
      fileCreateDto,
      reactCreateDto,
      senderId,
      null,
      null,
      null,
      threadId,
    )

    if (fileCreateDto) {
      const limitFileSize = this.limitFileSize(fileCreateDto.size)
      console.log(limitFileSize)

      if (limitFileSize) {
        return {
          success: false,
          message: 'File size is too large',
          errors: 'File size is too large',
          thread: null,
        }
      }
    }
    await this.threadRepository.createReplyThread(thread)
    return {
      success: true,
      message: 'Create reply thread success',
      errors: null,
      thread: null,
    }
  }

  async addReact(
    react: string,
    quantity: number,
    threadId: string,
    senderId: string,
  ) {
    const reactToDb = this.compareToCreateReact(
      react,
      quantity,
      threadId,
      senderId,
    )
    const thread = await this.threadRepository.addReact(reactToDb)
    return {
      thread,
    }
  }

  async removeReact(threadId: string, senderId: string) {
    const reactToDb = this.compareToCreateReact(null, null, threadId, senderId)
    const thread = await this.threadRepository.removeReact(reactToDb)
    return {
      thread,
    }
  }

  async getAllThread(type: string, id: string, req) {
    const threads = await this.threadRepository.getAllThread(type, id)
    const newThreads = threads.map((item) => {
      const newAvatar = this.commonService.transferFileToURL(
        req,
        item.user?.avatar,
      )
      delete item.user?.password
      return {
        ...item,
        files: item.files.map((file) => {
          return {
            ...file,
            size: this.convertToMB(file.size),
            path: this.commonService.transferFileToURL(req, file.path),
          }
        }),
        user: {
          ...item.user,
          avatar: newAvatar,
        },
        replys:
          item.replys.length > 0 &&
          item.replys.map((rep) => {
            delete rep.user?.password
            return {
              ...rep,
              user: {
                ...rep.user,
                avatar: this.commonService.transferFileToURL(
                  req,
                  rep.user.avatar,
                ),
              },
              files: rep.files.map((file) => {
                return {
                  ...file,
                  size: this.convertToMB(file.size),
                  path: this.commonService.transferFileToURL(req, file.path),
                }
              }),
            }
          }),
      }
    })
    return newThreads
  }

  async getThreadById(threadId: string) {
    const thread = await this.threadRepository.getThreadById(threadId)
    return thread
  }

  async getThreadByReceiveId(receiveId: string) {
    const thread = await this.threadRepository.getThreadByReceiveId(receiveId)
    return thread
  }

  async findByText(text: string) {
    const findByText = await this.threadRepository.findByText(text)
    const data = findByText.map((item) => {
      return {
        ...item,
      }
    })
    return data
  }

  async findByDate(from: string, to?: string) {
    const threads = await this.threadRepository.findByDate(from, to)
    return threads
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
    }
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
    }
  }

  private convertDateToDB(date: string) {
    const convert = new Date(date)
    const year = convert.getFullYear()
    const month =
      convert.getMonth() + 1 < 10
        ? `0${convert.getMonth() + 1}`
        : convert.getMonth() + 1

    const day = convert.getDate()

    const formattedDate = `${year}-${month}-${day}`
    return formattedDate
  }

  private convertToMB = (bytes: number) => {
    const mb = bytes / 1024 / 1024
    return mb.toFixed(2)
  }

  private limitFileSize = (bytes: number) => {
    const fileSize = bytes / 1024 / 1024 // MB
    if (fileSize > 10) {
      return true
    }
    return false
  }
  transformFile(file) {
    return {
      ...file,
      size: this.convertToMB(file.size),
    }
  }

  transformUser(req, user) {
    return {
      ...user,
      avatar: this.commonService.transferFileToURL(req, user.avatar),
    }
  }

  transformReply(req, reply) {
    return {
      ...reply,
      user: this.transformUser(req, reply.user),
      files: reply.files.map((file) => this.transformFile(file)),
    }
  }

  transformThread(req, thread) {
    return {
      ...thread,
      files: thread.files.map((file) => this.transformFile(file)),
      user: this.transformUser(req, thread.user),
      replys: thread.replys.map((reply) => this.transformReply(req, reply)),
    }
  }
}
