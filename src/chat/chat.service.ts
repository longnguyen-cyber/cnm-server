import { Injectable } from '@nestjs/common'
import { ChatRepository } from './chat.repository'
import { ChatToDBDto } from './dto/relateDB/ChatToDB.dto'
import { CommonService } from '../common/common.service'

@Injectable()
export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private readonly commonService: CommonService,
  ) {}

  async getAllChat(userId: string) {
    const rs = await this.chatRepository.getAllChat(userId)
    return rs.map((chat) => this.buildChatResponse(chat))
  }

  async getChatById(chatId: string, userId: string) {
    return this.buildChatResponse(
      await this.chatRepository.getChatById(chatId, userId),
    )
  }

  async createChat(senderId: string, receiveId: string) {
    const chatToDb = this.compareToCreateChat(senderId, receiveId)
    const chat = await this.chatRepository.createChat(chatToDb)
    return chat
  }

  private compareToCreateChat(
    senderId: string,
    receiveId: string,
  ): ChatToDBDto {
    return {
      senderId,
      receiveId,
    }
  }

  private buildChatResponse(chat: any) {
    const buildChat = this.commonService.deleteField(chat, [])
    return buildChat
  }
}
