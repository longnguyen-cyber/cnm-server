import { Injectable } from '@nestjs/common'
import { ChannelService } from './channel/channel.service'
import { ChatService } from './chat/chat.service'

@Injectable()
export class AppService {
  constructor(
    private readonly channelService: ChannelService,
    private readonly chatService: ChatService,
  ) {}
  getHello(): string {
    return 'Health check'
  }

  async getAll(userId: string) {
    const channels = await this.channelService.getAllChannel(userId)
    const chats = await this.chatService.getAllChat(userId)
    const rs = [...channels, ...chats]
    rs.sort((a, b) => {
      return new Date(b.timeThread).getTime() - new Date(a.timeThread).getTime()
    })

    return rs
  }
}
