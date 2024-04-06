import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { ChatRepository } from './chat.repository'
import { ChatToDBDto } from './dto/relateDB/ChatToDB.dto'
import { CommonService } from '../common/common.service'
import { UserService } from '../user/user.service'

@Injectable()
export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private readonly commonService: CommonService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  async getAllChat(userId: string) {
    const rs = await this.chatRepository.getAllChat(userId)

    return rs.map((chat) => this.commonService.deleteField(chat, ['thread']))
  }

  async getChatById(chatId: string, userId: string) {
    const chat = await this.chatRepository.getChatById(chatId, userId)
    if (!chat) return this.buildChatResponse(chat, ['thread', 'channel'])
    chat.threads = chat.threads.map((thread) => {
      thread.files = thread.files.map((file) => {
        file.size = this.commonService.convertToSize(file.size)
        return file
      })
      return thread
    })
    return this.buildChatResponse(chat, ['thread', 'channel'])
  }

  async getChatByUserId(senderId: string, userId: string) {
    return await this.chatRepository.getChatByUserId(senderId, userId)
  }

  async createChat(senderId: string, data: any, stoneId: string) {
    const chatToDb = this.compareToCreateChat(senderId, data)
    const chat = await this.chatRepository.createChat(chatToDb, stoneId)
    if (chat) {
      await this.userService.updateCacheUser()
    }
    return this.commonService.deleteField(chat, ['thread'])
  }

  async reqAddFriendHaveChat(chatId: string, receiveId: string) {
    const req = await this.chatRepository.reqAddFriendHaveChat(
      chatId,
      receiveId,
    )
    if (req) {
      await this.userService.updateCacheUser()
    }
    return this.commonService.deleteField(req, ['thread'], ['status'])
  }

  async reqAddFriend(receiveId: string, senderId: string) {
    const req = await this.chatRepository.reqAddFriend(receiveId, senderId)
    if (req) {
      await this.userService.updateCacheUser()
    }
    return this.commonService.deleteField(req, ['thread'])
  }
  async unReqAddFriend(chatId: string, userId: string) {
    const req = await this.chatRepository.unReqAddFriend(chatId, userId)
    if (req) {
      await this.userService.updateCacheUser()
    }
    return this.commonService.deleteField(req, ['thread'])
  }

  async getFriendChatWaittingAccept(receiveId: string, userId: string) {
    return this.chatRepository.getFriendChatWaittingAccept(receiveId, userId)
  }

  async acceptAddFriend(chatId: string, userId: string) {
    const accept = await this.chatRepository.acceptAddFriend(chatId, userId)
    if (accept) {
      await this.userService.updateCacheUser()
    }
    return this.commonService.deleteField(accept, ['thread'], ['status'])
  }

  async rejectAddFriend(chatId: string, userId: string) {
    const req = await this.chatRepository.rejectAddFriend(chatId, userId)
    if (req) {
      await this.userService.updateCacheUser()
    }
    return this.commonService.deleteField(req, ['thread'])
  }

  async whitelistFriendAccept(userId: string) {
    return (await this.chatRepository.whitelistFriendAccept(userId)).map(
      (chat) => {
        return this.buildChatResponse(chat, ['thread'])
      },
    )
  }

  async waitlistFriendAccept(userId: string) {
    return (await this.chatRepository.waitlistFriendAccept(userId)).map(
      (chat) => {
        return this.buildChatResponse(chat, ['threads'])
      },
    )
  }

  async unfriend(chatId: string) {
    const req = await this.chatRepository.unfriend(chatId)
    if (req) {
      await this.userService.updateCacheUser()
    }
    return this.commonService.deleteField(req, ['thread'], ['status'])
  }

  private compareToCreateChat(senderId: string, data: any): ChatToDBDto {
    return {
      senderId,
      ...data,
    }
  }

  private buildChatResponse(
    chat: any,
    removeFields: string[],
    addFields?: string[],
  ) {
    const buildChat = this.commonService.deleteField(chat, removeFields, [
      'createdAt',
    ])
    return buildChat
  }
}
