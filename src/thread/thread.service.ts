import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { AppService } from '../app.service'
import { CommonService } from '../common/common.service'
import { Queue as QueueEnum, UploadMethod } from '../enums'
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'
import { FileCreateDto } from './dto/fileCreate.dto'
import { MessageCreateDto } from './dto/messageCreate.dto'
import { ThreadToDBDto } from './dto/relateDB/threadToDB.dto'
import { ThreadRepository } from './thread.repository'
import { Queue as QueueThread } from 'bull'
import { InjectQueue } from '@nestjs/bull'
import { Interval } from '@nestjs/schedule'
import { EmojiToDBDto } from './dto/relateDB/emojiToDB.dto'

@Injectable()
export class ThreadService {
  constructor(
    private threadRepository: ThreadRepository,
    private commonService: CommonService,
    @Inject('RabbitMQUploadService')
    private readonly rabbitMQService: RabbitMQService,
    @Inject(AppService) private appService: AppService,
    @InjectQueue('queue') private readonly threadQueue: QueueThread,
  ) {}
  // QUEUE

  @Interval(1000 * 10) // Chạy 5s 1 lần
  async handleInterval() {
    const jobs = await this.threadQueue.getJobs([
      'active',
      'waiting',
      'completed',
      'failed',
      'delayed',
      'paused',
    ])

    const filteredJobsSend = jobs
      .filter((job) => job.name === 'send-thread' && job.opts.lifo === true)
      .sort((a, b) => {
        return a.timestamp - b.timestamp
      })

    const filteredJobsDelete = jobs
      .filter((job) => job.name === 'delete-thread' && job.opts.lifo === true)
      .sort((a, b) => {
        return a.timestamp - b.timestamp
      })

    const filteredJobsRecall = jobs
      .filter((job) => job.name === 'recall-thread' && job.opts.lifo === true)
      .sort((a, b) => {
        return a.timestamp - b.timestamp
      })

    // 1711857378169
    if (filteredJobsSend.length > 0) {
      filteredJobsSend.forEach(async (job) => {
        const data = job.data
        const result = await this.sendQueue(data)
        if (result) {
          console.log('Send thread success')
        }
        job.remove()
      })
    }
    if (filteredJobsDelete.length > 0) {
      filteredJobsDelete.forEach(async (job) => {
        const data = job.data
        const result = await this.deleteQueue(
          data.threadId,
          data.userDeleteId,
          data.type,
        )
        if (result) {
          console.log('Delete thread success')
        }
        job.remove()
      })
    }

    if (filteredJobsRecall.length > 0) {
      filteredJobsRecall.forEach(async (job) => {
        const data = job.data
        job.remove()
        const result = await this.recallQueue(
          data.threadId,
          data.recallId,
          data.type,
        )
        if (result) {
          console.log('Recall thread success')
        }
        job.remove()
      })
    }
  }

  private async sendQueue(threadRaw: any) {
    const {
      messageCreateDto,
      fileCreateDto,
      replyId,
      senderId,
      receiveId,
      channelId,
      chatId,
    } = threadRaw
    const threadToDb = this.compareToCreateThread(
      messageCreateDto,
      fileCreateDto,
      replyId,
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
          QueueEnum.Upload,
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

  async createThread(
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto[],
    senderId?: string,
    receiveId?: string,
    channelId?: string,
    chatId?: string,
    replyId?: string,
  ) {
    const threadToDb = {
      messageCreateDto,
      fileCreateDto,
      replyId,
      senderId,
      receiveId,
      channelId,
      chatId,
    }

    if (fileCreateDto) {
      console.log('fileCreateDto', fileCreateDto)
      this.sendQueue(threadToDb)
    } else {
      console.log('messageCreateDto', messageCreateDto)
      await this.threadQueue.add('send-thread', threadToDb, {
        lifo: true,
      })
    }
  }

  async updateThread(
    threadId: string,
    senderId: string,
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto[],
    chatId?: string,
    channelId?: string,
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
          QueueEnum.Upload,
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
        QueueEnum.Upload,
        UploadMethod.DeleteMultiple,
        files,
      )
    }
    return thread
  }

  async deleteThread(threadId: string, userDeleteId: string, type: string) {
    //get file before delete to delete file in s3

    await this.threadQueue.add(
      'delete-thread',
      { threadId, userDeleteId, type },
      { lifo: true },
    )
  }

  private async deleteQueue(
    threadId: string,
    userDeleteId: string,
    type: string,
  ) {
    const thread = await this.threadRepository.deleteThread(
      threadId,
      userDeleteId,
      type,
    )
    return thread
  }

  async recallSendThread(threadId: string, recallId: string, type: string) {
    await this.threadQueue.add(
      'recall-thread',
      { threadId, recallId, type },
      { lifo: true },
    )
  }

  private async recallQueue(threadId: string, recallId: string, type: string) {
    const thread = await this.threadRepository.recallSendThread(
      threadId,
      recallId,
      type,
    )
    return thread
  }

  async createReplyThread(
    threadId: string,
    senderId?: string,
    messageCreateDto?: MessageCreateDto,
    fileCreateDto?: FileCreateDto[],
    channelId?: string,
    chatId?: string,
  ) {
    const thread = this.compareToCreateThread(
      messageCreateDto,
      fileCreateDto,
      null,
      senderId,
      null,
      channelId,
      chatId,
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
    if (reply) {
      this.appService.getAll(senderId)
    }
    return reply
  }

  async addEmoji(
    emoji: string,
    quantity: number,
    threadId: string,
    senderId: string,
  ) {
    const emojiToDb = this.compareToCreateEmoji(
      emoji,
      quantity,
      threadId,
      senderId,
    )
    const thread = await this.threadRepository.addEmoji(emojiToDb)
    return thread
  }

  async removeEmoji(threadId: string, senderId: string) {
    const emojiToDb = this.compareToCreateEmoji(null, null, threadId, senderId)
    const thread = await this.threadRepository.removeEmoji(emojiToDb)
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

  async threadExists(threadId: string, recallId: string, type: string) {
    const thread = await this.threadRepository.threadExists(
      threadId,
      recallId,
      type,
    )
    return thread
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
    replyId?: string,
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
      replyId,
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

  private compareToCreateEmoji(
    emoji?: string,
    quantity?: number,
    threadId?: string,
    senderId?: string,
  ): EmojiToDBDto {
    return {
      emoji,
      quantity,
      threadId,
      senderId,
    }
  }
}
