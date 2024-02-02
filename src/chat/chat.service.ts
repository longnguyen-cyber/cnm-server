import { Injectable } from '@nestjs/common'
import { CommonService } from '../common/common.service'
import { ChatRepository } from './chat.repository'
import { ChatCreateDto } from './dto/ChatCreate.dto'
import { ChatToDBDto } from './dto/relateDB/ChatToDB.dto'

@Injectable()
export class ChatService {
  constructor(private chatRepository: ChatRepository) {}

  async getAllChat() {
    return await this.chatRepository.getAllChat()
  }

  async getChatById(chatId: string) {
    return await this.chatRepository.getChatById(chatId)
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
}
