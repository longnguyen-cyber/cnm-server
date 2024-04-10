import { CACHE_MANAGER, forwardRef, Inject, Injectable } from '@nestjs/common'
import { ChatRepository } from './chat.repository'
import { ChatToDBDto } from './dto/relateDB/ChatToDB.dto'
import { CommonService } from '../common/common.service'
import { UserService } from '../user/user.service'
import { Cache } from 'cache-manager'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private readonly commonService: CommonService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  async getAllChat(userId: string) {
    const strings = 'chats-65bceb94ceda5567efc0b629'
    const chatsCache = await this.cacheManager.get(`chats-${userId}`)
    const parsedCache = JSON.parse(chatsCache as string) as Array<any>
    if (false) {
      const rs = parsedCache.filter(
        (chat) => chat.senderId === userId || chat.receiveId === userId,
      )
      console.log('cache hit userId: ', userId)
      return rs.length > 0 ? rs : []
    } else {
      console.log('cache miss userId: ', userId)
      const rs = await this.chatRepository.getAllChat(userId)
      const final = rs.map((chat) => {
        return this.commonService.deleteField(chat, ['thread'])
      })
      await this.cacheManager.set(`chats-${userId}`, JSON.stringify(final), {
        ttl: this.configService.get<number>('CHAT_EXPIRED'),
      })
      return final
    }
  }

  async updateCacheChats(userId: string) {
    const rs = await this.chatRepository.getAllChat(userId)
    const final = rs.map((chat) => {
      return this.commonService.deleteField(chat, ['thread'])
    })
    await this.cacheManager.set(`chats-${userId}`, JSON.stringify(final), {
      ttl: this.configService.get<number>('CHAT_EXPIRED'),
    })
    console.log('cache', await this.cacheManager.get(`chats-${userId}`))
    console.log('cache chats update userId: ', userId)
  }
  async getChatById(chatId: string, userId: string) {
    const chatCache = await this.cacheManager.get(`chat-${chatId}`)
    console.log('chatCache: ', chatCache)
    if (chatCache) {
      console.log('cache hit chatId: ', chatId)
      const chatParse = JSON.parse(chatCache as any)
      if (
        (chatParse.senderId === userId || chatParse.receiveId === userId) &&
        chatParse.id === chatId
      ) {
        return chatParse
      }
    } else {
      console.log('cache miss chatId: ', chatId)
      const chat = await this.chatRepository.getChatById(chatId, userId)
      if (!chat) return null
      chat.threads = chat.threads.map((thread) => {
        thread.files = thread.files.map((file) => {
          file.size = this.commonService.convertToSize(file.size)
          return file
        })
        return thread
      })

      const rs = this.buildChatResponse(chat, ['thread', 'channel'])

      await this.cacheManager.set(`chat-${chatId}`, JSON.stringify(rs), {
        ttl: this.configService.get<number>('CHAT_EXPIRED'),
      })
      return rs
    }
  }

  async updateCacheChat(chatId: string, userId: string) {
    const chat = await this.chatRepository.getChatById(chatId, userId)
    console.log('before', await this.cacheManager.get(`chat-${chatId}`))
    if (!chat) return false
    chat.threads = chat.threads.map((thread) => {
      thread.files = thread.files.map((file) => {
        file.size = this.commonService.convertToSize(file.size)
        return file
      })
      return thread
    })

    const rs = this.buildChatResponse(chat, ['thread', 'channel'])
    console.log('rs: ', rs)

    await this.cacheManager.set(`chat-${chatId}`, JSON.stringify(rs), {
      ttl: this.configService.get<number>('CHAT_EXPIRED'),
    })
    console.log('after', await this.cacheManager.get(`chat-${chatId}`))

    console.log('cache update chatId: ', chatId, 'userId: ', userId)
    return true
  }

  async getChatByUserId(senderId: string, userId: string) {
    return await this.chatRepository.getChatByUserId(senderId, userId)
  }

  async createChat(senderId: string, data: any, stoneId: string) {
    const chatToDb = this.compareToCreateChat(senderId, data)
    const chat = await this.chatRepository.createChat(chatToDb, stoneId)
    if (chat) {
      //update cache user to search
      await this.userService.updateCacheUser()
      //update cache chat and chats
      this.updateCacheChat(chat.id, senderId)
      this.updateCacheChat(chat.id, chat.receiveId)
      this.updateCacheChats(senderId)
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
