import {
  CACHE_MANAGER,
  forwardRef,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cache } from 'cache-manager'
import { CommonService } from '../common/common.service'
import { UserService } from '../user/user.service'
import { ChatRepository } from './chat.repository'
import { ChatToDBDto } from './dto/relateDB/ChatToDB.dto'

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(
    private chatRepository: ChatRepository,
    private readonly commonService: CommonService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    // const listFriend = await this.chatRepository.listFriend()
    // this.cacheManager.set('listFriend', JSON.stringify(listFriend), {
    //   ttl: this.configService.get<number>('CHAT_EXPIRED'),
    // })
  }

  async isFriend(senderId: string, receiveId: string) {
    const listFriend = await this.cacheManager.get('listFriend')
    if (listFriend) {
      const listFriendParse = JSON.parse(listFriend as any)
      const isFriend = listFriendParse.find(
        (friend) =>
          (friend.senderId === senderId && friend.receiveId === receiveId) ||
          (friend.senderId === receiveId && friend.receiveId === senderId)
      )

      return isFriend.isFriend ? true : false
    }
  }

  async updateListFriend() {
    const listFriend = await this.chatRepository.listFriend()
    this.cacheManager.set('listFriend', JSON.stringify(listFriend), {
      ttl: this.configService.get<number>('CHAT_EXPIRED'),
    })
  }

  async getAllChat(userId: string) {
    const chatsCache = await this.cacheManager.get(`chats`)
    if (chatsCache) {
      const parsedCache = JSON.parse(chatsCache as string) as Array<any>
      const rs = parsedCache.filter(
        (chat) => chat.senderId === userId || chat.receiveId === userId
      )

      const newRs = await Promise.all(
        rs.map(async (chat) => {
          const userReceiveId =
            chat.senderId === userId ? chat.receiveId : chat.senderId
          const userReceive = await this.userService.searchUserById(
            userReceiveId
          )
          this.commonService.deleteField(userReceive, ['settings', 'chatIds'])

          return {
            ...chat,
            user: userReceive,
          }
        })
      )

      console.log('cache hit userId: ', userId)
      return newRs.length > 0 ? newRs : []
    } else {
      console.log('cache miss userId: ', userId)
      const rs = await this.chatRepository.getAllChat(userId)
      const final = rs.map((chat) => {
        return this.commonService.deleteField(chat, ['thread'])
      })
      await this.cacheManager.set(`chats`, JSON.stringify(final), {
        ttl: this.configService.get<number>('CHAT_EXPIRED'),
      })
      return final
    }
  }

  async getChatById(chatId: string, userId: string) {
    const chatCache = await this.cacheManager.get(`chat-${chatId}`)
    if (chatCache) {
      console.log('cache hit chatId: ', chatId)
      const chatParse = JSON.parse(chatCache as any)
      if (
        (chatParse.senderId === userId || chatParse.receiveId === userId) &&
        chatParse.id === chatId
      ) {
        const receiveId =
          chatParse.senderId === userId
            ? chatParse.receiveId
            : chatParse.senderId
        const userReceive = await this.userService.searchUserById(receiveId)
        return {
          ...chatParse,
          user: this.commonService.deleteField(userReceive, [
            'chatIds',
            'userId',
          ]),
        }
      }
    } else {
      console.log('cache miss chatId: ', chatId)
      const chat = await this.chatRepository.getChatById(chatId, userId)
      if (!chat) return null
      if (chat.threads) {
        chat.threads = chat.threads.map((thread) => {
          if (thread.files) {
            thread.files = thread.files.map((file) => {
              file.size = this.commonService.convertToSize(file.size)
              return file
            })
          }
          return thread
        })
      }

      const rs = this.buildChatResponse(chat, ['thread', 'channel', 'chatIds'])

      await this.cacheManager.set(`chat-${chatId}`, JSON.stringify(rs), {
        ttl: this.configService.get<number>('CHAT_EXPIRED'),
      })
      return rs
    }
  }

  async updateCacheChats(userId: string) {
    console.time('updateCacheChats')
    const rs = await this.chatRepository.getAllChat(userId)
    const final = rs.map((chat) => {
      return this.commonService.deleteField(chat, ['thread'])
    })
    await this.cacheManager.set(`chats`, JSON.stringify(final), {
      ttl: this.configService.get<number>('CHAT_EXPIRED'),
    })
    console.timeEnd('updateCacheChats')
  }

  async updateCacheChat(chatId: string, userId: string) {
    const chat = await this.chatRepository.getChatById(chatId, userId)

    if (!chat) return false
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

    console.log('cache update chatId: ', chatId, 'userId: ', userId)
  }

  async getChatByUserId(senderId: string, userId: string) {
    return await this.chatRepository.getChatByUserId(senderId, userId)
  }

  async createChat(senderId: string, data: any, stoneId: string) {
    const chatToDb = this.compareToCreateChat(senderId, data)
    const chat = await this.chatRepository.createChat(chatToDb, stoneId)

    return this.commonService.deleteField(chat, ['thread'])
  }

  async reqAddFriendHaveChat(chatId: string, receiveId: string) {
    const req = await this.chatRepository.reqAddFriendHaveChat(
      chatId,
      receiveId
    )

    return this.commonService.deleteField(req, ['thread'], ['status'])
  }

  async reqAddFriend(receiveId: string, senderId: string) {
    const req = await this.chatRepository.reqAddFriend(receiveId, senderId)

    return this.commonService.deleteField(req, ['thread'])
  }
  async unReqAddFriend(chatId: string, userId: string) {
    const req = await this.chatRepository.unReqAddFriend(chatId, userId)

    return this.commonService.deleteField(req, ['thread'])
  }

  async getFriendChatWaittingAccept(receiveId: string, userId: string) {
    return this.chatRepository.getFriendChatWaittingAccept(receiveId, userId)
  }

  async acceptAddFriend(chatId: string, userId: string) {
    const accept = await this.chatRepository.acceptAddFriend(chatId, userId)

    return this.commonService.deleteField(accept, ['thread'], ['status'])
  }

  async rejectAddFriend(chatId: string, userId: string) {
    const req = await this.chatRepository.rejectAddFriend(chatId, userId)

    return this.commonService.deleteField(req, ['thread'])
  }

  async whitelistFriendAccept(userId: string) {
    return (await this.chatRepository.whitelistFriendAccept(userId)).map(
      (chat) => {
        return this.buildChatResponse(chat, ['thread'])
      }
    )
  }

  async waitlistFriendAccept(userId: string) {
    return (await this.chatRepository.waitlistFriendAccept(userId)).map(
      (chat) => {
        return this.buildChatResponse(chat, ['threads'])
      }
    )
  }

  async searchFriend(keyword: string, userId: String) {
    const users = (await this.cacheManager.get('user')) as any

    const friends = (await this.cacheManager.get('listFriend')) as any
    if (friends) {
      const usersParse = JSON.parse(users)
      const friendsParse = JSON.parse(friends)
      const friendsFilter = friendsParse.filter(
        (friend) => friend.senderId === userId || friend.receiveId === userId
      )
      if (friendsFilter.length === 0) {
        return []
      }

      const usersFilter = usersParse.filter((user) => {
        return user.name.includes(keyword)
      }) as Array<any>

      const rs = friendsFilter.filter((friend) => {
        const user = usersFilter.find((user) => user.id === friend.user.id)
        if (user) {
          return friend
        }
      })

      if (rs.length > 0) {
        return this.commonService.deleteField(rs, ['chatIds', 'channels'])
      } else {
        return []
      }
    } else {
      return []
    }
  }

  async unfriend(chatId: string) {
    const req = await this.chatRepository.unfriend(chatId)
    if (req) {
      await this.updateListFriend()
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
    addFields?: string[]
  ) {
    const buildChat = this.commonService.deleteField(chat, removeFields, [
      'createdAt',
    ])
    return buildChat
  }
}
