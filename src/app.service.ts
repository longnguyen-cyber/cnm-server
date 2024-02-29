import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { ChannelService } from './channel/channel.service'
import { ChatService } from './chat/chat.service'
import { Cache } from 'cache-manager'

@Injectable()
export class AppService {
  constructor(
    private readonly channelService: ChannelService,
    private readonly chatService: ChatService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async getHello(userId: string): Promise<string> {
    const redis = (await this.cacheManager.get(userId)) as any
    console.log(redis)
    return 'Health check'
  }

  async getAll(userId: string) {
    const channels = await this.channelService.getAllChannel(userId)
    const chats = await this.chatService.getAllChat(userId)
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

    this.cacheManager.set(userId, final)

    return final
  }
}
