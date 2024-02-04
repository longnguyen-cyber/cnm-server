import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { CommonService } from '../common/common.service'
import { FileCreateDto } from './dto/fileCreate.dto'
import { MessageCreateDto } from './dto/messageCreate.dto'
import { ReactCreateDto } from './dto/reactCreate.dto'
import { ReactToDBDto } from './dto/relateDB/reactToDB.dto'
import { ThreadToDBDto } from './dto/relateDB/threadToDB.dto'
import { ThreadRepository } from './thread.repository'
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'
import { Queue, UploadMethod } from '../enums'

@Injectable()
export class ThreadService {
  constructor(
    private threadRepository: ThreadRepository,
    private commonService: CommonService,
    @Inject('RabbitMQUploadService')
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async createThread(
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto[],
    senderId?: string,
    receiveId?: string,
    channelId?: string,
    chatId?: string,
  ) {
    const threadToDb = this.compareToCreateThread(
      messageCreateDto,
      fileCreateDto,
      senderId,
      receiveId,
      channelId,
      chatId,
    )
    if (fileCreateDto) {
      const limitFileSize = fileCreateDto.some((file) => {
        return this.commonService.limitFileSize(file.size)
      })
      if (limitFileSize) {
        throw new HttpException(
          `Currently the file size has exceeded our limit (2MB). Please try again with a smaller file.`,
          HttpStatus.BAD_REQUEST,
        )
      } else {
        const payload = fileCreateDto.map((file) => {
          return {
            fileName: file.originalname,
            file: file.buffer,
          }
        })
        const uploadFile = await this.rabbitMQService.addToQueue(
          Queue.Upload,
          UploadMethod.UploadMultiple,
          payload,
        )

        if (uploadFile) {
          threadToDb.file = fileCreateDto.map((file) => {
            return {
              ...file,
              path: this.commonService.pathUpload(file.fileName),
            }
          })
        }
      }
    }

    const thread = await this.threadRepository.createThread(threadToDb)
    return thread
  }

  async updateThread(
    threadId: string,
    senderId: string,
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto[],
  ) {
    const oldThread = await this.threadRepository.getThreadById(threadId)
    const threadToDb = this.compareToUpdateThread(
      threadId,
      senderId,
      messageCreateDto,
      fileCreateDto,
    )

    if (fileCreateDto) {
      const limitFileSize = fileCreateDto.some((file) => {
        return this.commonService.limitFileSize(file.size)
      })

      if (limitFileSize) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'File size is too large',
          errors: `Currently the file size has exceeded our limit (2MB). Please try again with a smaller file.`,
        }
      } else {
        const payload = fileCreateDto.map((file) => {
          return {
            fileName: file.originalname,
            file: file.buffer,
          }
        })
        const uploadFile = await this.rabbitMQService.addToQueue(
          Queue.Upload,
          UploadMethod.UploadMultiple,
          payload,
        )

        if (uploadFile) {
          threadToDb.file = fileCreateDto.map((file) => {
            return {
              ...file,
              path: this.commonService.pathUpload(file.fileName),
            }
          })
        }
      }
    }
    const thread = await this.threadRepository.updateThread(threadToDb)
    if (thread && fileCreateDto) {
      const files = oldThread.files.map((file) => {
        return this.commonService.getFileName(file.path)
      })
      await this.rabbitMQService.addToQueue(
        Queue.Upload,
        UploadMethod.DeleteMultiple,
        files,
      )
    }
    return thread
  }

  async deleteThread(threadId: string, senderId: string) {
    const oldFile = await this.threadRepository.getThreadById(threadId)
    const thread = await this.threadRepository.deleteThread(threadId, senderId)
    if (thread && oldFile.files.length > 0) {
      const files = oldFile.files.map((file) => {
        return this.commonService.getFileName(file.path)
      })
      await this.rabbitMQService.addToQueue(
        Queue.Upload,
        UploadMethod.DeleteMultiple,
        files,
      )
    }
    return thread
  }

  async recallSendThread(threadId: string, senderId: string) {
    const thread = await this.threadRepository.recallSendThread(
      threadId,
      senderId,
    )
    return thread
  }

  async createReplyThread(
    threadId: string,
    senderId?: string,
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto[],
  ) {
    const thread = this.compareToCreateThread(
      messageCreateDto,
      fileCreateDto,
      senderId,
      null,
      null,
      null,
      threadId,
    )

    if (fileCreateDto) {
      const limitFileSize = fileCreateDto.some((file) => {
        return this.commonService.limitFileSize(file.size)
      })

      if (limitFileSize) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'File size is too large',
          errors: `Currently the file size has exceeded our limit (2MB). Please try again with a smaller file.`,
        }
      }
    }
    const reply = await this.threadRepository.createReplyThread(thread)
    return reply
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
    return thread
  }

  async removeReact(threadId: string, senderId: string) {
    const reactToDb = this.compareToCreateReact(null, null, threadId, senderId)
    const thread = await this.threadRepository.removeReact(reactToDb)
    return thread
  }

  async getAllThread(type?: string, id?: string) {
    const threads = await this.threadRepository.getAllThread(type, id)
    const newThreads = threads.map((item) => {
      delete item.user?.password
      return {
        ...item,
        files: item.files.map((file) => {
          return {
            ...file,
            size: this.commonService.convertToSize(file.size),
          }
        }),
        replys:
          item.replys.length > 0 &&
          item.replys.map((rep) => {
            delete rep.user?.password
            return {
              ...rep,
              files: rep.files.map((file) => {
                return {
                  ...file,
                  size: this.commonService.convertToSize(file.size),
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
    fileCreateDto?: FileCreateDto[],
    senderId?: string,
    receiveId?: string,
    channelId?: string,
    chatId?: string,
    threadId?: string,
  ): ThreadToDBDto {
    return {
      messages: messageCreateDto,
      file: fileCreateDto
        ? fileCreateDto.map((file) => {
            return {
              fileName: file.originalname,
              size: file.size,
              path: file.path,
            }
          })
        : null,
      senderId,
      receiveId,
      channelId,
      chatId,
      threadId,
    }
  }

  private compareToUpdateThread(
    threadId: string,
    senderId: string,
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto[],
  ): any {
    return {
      threadId,
      senderId,
      messages: messageCreateDto,
      file: fileCreateDto
        ? fileCreateDto.map((file) => {
            return {
              fileName: file.originalname,
              size: file.size,
              path: file.path,
            }
          })
        : null,
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
}
