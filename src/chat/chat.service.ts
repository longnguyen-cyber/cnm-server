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
    return rs.map((chat) => this.commonService.deleteField(chat, ['thread']))
  }

  async getChatById(chatId: string, userId: string) {
    return this.buildChatResponse(
      await this.chatRepository.getChatById(chatId, userId),
      ['thread'],
    )
  }

  async createChat(senderId: string, receiveId: string) {
    const chatToDb = this.compareToCreateChat(senderId, receiveId)
    const chat = await this.chatRepository.createChat(chatToDb)
    return chat
  }

  async reqAddFriend(chatId: string, receiveId: string) {
    return this.chatRepository.reqAddFriend(chatId, receiveId)
  }

  async acceptAddFriend(chatId: string, userId: string) {
    return this.chatRepository.acceptAddFriend(chatId, userId)
  }

  async whitelistFriendAccept(userId: string) {
    return (await this.chatRepository.whitelistFriendAccept(userId)).map(
      (chat) => {
        return this.buildChatResponse(chat, ['thread'])
      },
    )
  }

  async waitlistFriendAccept(userId: string) {
    return this.chatRepository.waitlistFriendAccept(userId)
  }

  async unfriend(chatId: string, userId: string) {
    return this.chatRepository.unfriend(chatId, userId)
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

  private buildChatResponse(
    chat: any,
    removeFields: string[],
    addFields?: string[],
  ) {
    const buildChat = this.commonService.deleteField(chat, removeFields, [
      'updatedAt',
    ])
    return buildChat
  }
}
