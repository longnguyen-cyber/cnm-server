import { InjectQueue } from '@nestjs/bull'
import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { Queue as QueueThread } from 'bull'
import { AppService } from '../app.service'
import { ChannelService } from '../channel/channel.service'
import { ChatService } from '../chat/chat.service'
import { CommonService } from '../common/common.service'
import { FileCreateDto } from './dto/fileCreate.dto'
import { MessageCreateDto } from './dto/messageCreate.dto'
import { EmojiToDBDto } from './dto/relateDB/emojiToDB.dto'
import { ThreadToDBDto } from './dto/relateDB/threadToDB.dto'
import { ThreadRepository } from './thread.repository'
import { UserService } from '../user/user.service'

@Injectable()
export class ThreadService {
  constructor(
    private threadRepository: ThreadRepository,
    private commonService: CommonService,
    @Inject(AppService)
    private appService: AppService,
    @InjectQueue('queue') private readonly threadQueue: QueueThread,
    private readonly chatService: ChatService,
    private readonly channelService: ChannelService,
    private readonly userService: UserService
  ) {}
  // QUEUE

  @Interval(1000 * 10) // Chạy 10s 1 lần
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
    if (filteredJobsSend.length > 0) {
      filteredJobsSend.forEach(async (job) => {
        // job.remove()

        const data = job.data
        const timeStart = new Date().getTime()
        const result = await this.sendQueue(data)
        if (result) {
          if (data.cloudId) {
            await this.userService.updateCacheCloud(data.senderId)
          } else if (data.channelId) {
            await this.channelService.updateCacheChannel(
              data.channelId,
              data.stoneId
            )
            await this.channelService.updatedCacheChannels('', data.senderId)
          } else {
            await this.chatService.updateCacheChat(data.chatId, data.senderId)
            await this.chatService.updateCacheChats(data.senderId)
          }
        }
        console.log('jobid', job.id)

        job.remove()
        console.log('time', new Date().getTime() - timeStart)
      })
    }
    if (filteredJobsDelete.length > 0) {
      filteredJobsDelete.forEach(async (job) => {
        const threadExists = filteredJobsSend.find((item) => {
          return item.data.stoneId === job.data.stoneId
        }) // check thread exists in send queue do not delete
        if (!threadExists) {
          const data = job.data
          const timeStart = new Date().getTime()
          const result = await this.deleteQueue(
            data.stoneId,
            data.userDeleteId,
            data.type
          )
          if (result) {
            if (data.cloudId) {
              await this.userService.updateCacheCloud(data.userDeleteId)
            } else if (data.chatId) {
              await this.chatService.updateCacheChat(
                data.chatId,
                data.userDeleteId
              )
            } else {
              await this.channelService.updateCacheChannel(
                data.channelId,
                data.stoneId,
                'delete'
              )
            }
            console.log('Delete thread success')
          }
          job.remove()
          console.log('time', new Date().getTime() - timeStart)
        }
      })
    }

    if (filteredJobsRecall.length > 0) {
      filteredJobsRecall.forEach(async (job) => {
        const threadExists = filteredJobsSend.find((item) => {
          return item.data.stoneId === job.data.stoneId
        }) // check thread exists in send queue do not recall
        if (!threadExists) {
          const data = job.data
          const timeStart = new Date().getTime()
          const result = await this.recallQueue(
            data.stoneId,
            data.recallId,
            data.type
          )
          if (result) {
            if (data.chatId) {
              await this.chatService.updateCacheChat(data.chatId, data.recallId)
            } else if (data.cloudId) {
              await this.userService.updateCacheCloud(data.recallId)
            } else {
              await this.channelService.updateCacheChannel(
                data.channelId,
                data.stoneId
              )
            }
            console.log('Recall thread success')
          }

          job.remove()
          console.log('time', new Date().getTime() - timeStart)
        }
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
      stoneId,
      cloudId,
      mentions,
    } = threadRaw
    const threadToDb = this.compareToCreateThread(
      messageCreateDto,
      fileCreateDto,
      replyId,
      senderId,
      receiveId,
      channelId,
      cloudId,
      chatId,
      stoneId,
      mentions
    )

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
    stoneId?: string,
    cloudId?: string,
    mentions?: string[]
  ) {
    const threadToDb = {
      messageCreateDto,
      fileCreateDto,
      replyId,
      senderId,
      receiveId,
      channelId,
      chatId,
      stoneId,
      cloudId,
      mentions,
    }

    await this.threadQueue.add('send-thread', threadToDb, {
      lifo: true,
    })
  }

  async updateThread(
    stoneId: string,
    senderId: string,
    messageCreateDto?: MessageCreateDto,
    pin?: boolean
  ) {
    const threadToDb = this.compareToUpdateThread(
      stoneId,
      senderId,
      messageCreateDto,
      pin
    )

    const thread = await this.threadRepository.updateThread(threadToDb)

    return thread
  }

  async deleteThread(
    stoneId: string,
    userDeleteId: string,
    type: string,
    chatId?: string,
    channelId?: string,
    cloudId?: string
  ) {
    //get file before delete to delete file in s3

    await this.threadQueue.add(
      'delete-thread',
      { stoneId, userDeleteId, type, chatId, channelId, cloudId },
      { lifo: true }
    )
  }

  private async deleteQueue(
    stoneId: string,
    userDeleteId: string,
    type: string
  ) {
    const thread = await this.threadRepository.deleteThread(
      stoneId,
      userDeleteId,
      type
    )
    return thread
  }

  async recallSendThread(
    stoneId: string,
    recallId: string,
    type: string,
    chatId?: string,
    channelId?: string,
    cloudId?: string
  ) {
    await this.threadQueue.add(
      'recall-thread',
      { stoneId, recallId, type, chatId, channelId, cloudId },
      { lifo: true }
    )
  }

  private async recallQueue(stoneId: string, recallId: string, type: string) {
    const thread = await this.threadRepository.recallSendThread(
      stoneId,
      recallId,
      type
    )
    return thread
  }

  async addEmoji(
    emoji: string,
    quantity: number,
    stoneId: string,
    senderId: string
  ) {
    const emojiToDB = this.compareToCreateEmoji(emoji, stoneId, senderId)
    const thread = await this.threadRepository.addEmoji(emojiToDB)
    return thread
  }

  async removeEmoji(emoji: string, stoneId: string, senderId: string) {
    const emojiToDb = this.compareToCreateEmoji(emoji, stoneId, senderId)
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

  async threadExists(stoneId: string, recallId: string, type: string) {
    const thread = await this.threadRepository.threadExists(
      stoneId,
      recallId,
      type
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
    cloudId?: string,
    chatId?: string,
    stoneId?: string,
    mentions?: string[],
    threadId?: string
  ): ThreadToDBDto {
    return {
      messages: messageCreateDto,
      file: fileCreateDto
        ? fileCreateDto.map((file) => {
            return {
              filename: file.filename,
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
      stoneId,
      mentions,
      cloudId,
    }
  }

  private compareToUpdateThread(
    stoneId: string,
    senderId: string,
    messageCreateDto?: MessageCreateDto,
    pin?: boolean
  ): any {
    return {
      stoneId,
      senderId,
      messages: messageCreateDto,
      pin,
    }
  }

  private compareToCreateEmoji(
    emoji?: string,
    stoneId?: string,
    senderId?: string
  ): EmojiToDBDto {
    return {
      emoji,
      stoneId,
      senderId,
    }
  }
}
