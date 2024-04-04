import { CACHE_MANAGER, Inject, Injectable, UseGuards } from '@nestjs/common'
import { ChannelService } from './channel/channel.service'
import { ChatService } from './chat/chat.service'
import { Cache } from 'cache-manager'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AppService {
  constructor(
    private readonly channelService: ChannelService,
    private readonly chatService: ChatService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}
  async getHello() {
    return 'Health check'
  }

  async getAll(userId: string) {
    const channels = await this.channelService.getAllChannel(userId)
    const chats = await this.chatService.getAllChat(userId)
    chats.map((item) => {
      const lastedThread = item.lastedThread

      if (
        lastedThread !== null &&
        lastedThread.messages == null &&
        lastedThread.files.length > 0
      ) {
        if (userId === lastedThread.senderId) {
          lastedThread.messages = {
            message: `Bạn vừa gửi ${lastedThread.files.length} file`,
          }
        } else {
          lastedThread.messages = {
            message: `Bạn vừa nhận dược ${lastedThread.files.length} file`,
          }
        }
      }
    })

    channels.map((item) => {
      const lastedThread = item.lastedThread
      if (
        lastedThread !== null &&
        lastedThread.messages == null &&
        lastedThread.files.length > 0
      ) {
        if (userId === lastedThread.senderId) {
          lastedThread.messages = {
            message: `Bạn vừa gửi ${lastedThread.files.length} file`,
          }
        } else {
          lastedThread.messages = {
            message: `Bạn vừa nhận dược ${lastedThread.files.length} file`,
          }
        }
      }
    })

    const rs = [...channels, ...chats]
    rs.sort((a, b) => {
      return new Date(b.timeThread).getTime() - new Date(a.timeThread).getTime()
    })

    const final = rs.map((item) => {
      // if item is channel add field type = channel
      //else add field type = chat
      if (item.users) {
        return {
          ...item,
          type: 'channel',
        }
      } else {
        return {
          ...item,
          type: 'chat',
        }
      }
    })

    this.cacheManager.set(userId, final, {
      ttl: this.configService.get<number>('ALL_EXPIRED'),
    }) // 30 days

    return final
  }
}
