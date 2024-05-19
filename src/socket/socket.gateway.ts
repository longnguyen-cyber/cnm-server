import { HttpStatus, Req, UseGuards } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'
import { AuthGuard } from '../auth/guard/auth.guard'
import { ChannelService } from '../channel/channel.service'
import { ChatService } from '../chat/chat.service'
import { CommonService } from '../common/common.service'
import { ChannelType } from '../enums'
import { FileCreateDto } from '../thread/dto/fileCreate.dto'
import { MessageCreateDto } from '../thread/dto/messageCreate.dto'
import { ThreadService } from '../thread/thread.service'
import { UserService } from '../user/user.service'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private threadService: ThreadService,
    private channelService: ChannelService,
    private readonly chatService: ChatService,
    private commonService: CommonService,
    private userService: UserService
  ) {}
  user = []
  @WebSocketServer() server: Server

  handleConnection(@ConnectedSocket() socket: Socket, @Req() req: any) {
    const isAuthenticated = socket.handshake.auth
    console.log('connected')

    if (isAuthenticated) {
      this.user.push({ userId: isAuthenticated.userId })
      this.server.emit('online', this.user)
    }
  }
  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('disconnected')

    const isAuthenticated = socket.handshake.auth

    this.user = this.user.filter(
      (item) => item.userId !== isAuthenticated.userId
    )
    this.server.emit('online', this.user)
  }

  /**
   * @param data:{
   * messages:MessageCreateDto
   * fileCreateDto:FileCreateDto[]
   * receiveId:string
   * channelId:string
   * chatId:string
   * }
   * @param req: token
   * @returns
   * status: pass
   */
  @SubscribeMessage('sendThread')
  @UseGuards(AuthGuard)
  async handleSendThread(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('updatedSendThread', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const userId = req.user.id
      const {
        messages,
        fileCreateDto,
        receiveId,
        channelId,
        chatId,
        replyId, //stoneId
        cloudId,
        mentions,
        members,
      }: {
        messages?: MessageCreateDto
        fileCreateDto?: FileCreateDto[]
        receiveId?: string
        channelId?: string
        chatId?: string
        replyId?: string
        cloudId?: string
        mentions?: string[]
        members?: string[]
      } = data

      const stoneId = uuidv4()

      if (!messages && !fileCreateDto) {
        this.server.emit('updatedSendThread', {
          status: HttpStatus.BAD_REQUEST,
          message: 'Message or file is required',
        })
        return
      }

      const sender = this.commonService.deleteField(req.user, [])
      //retrun data immediately
      //!return message not reply
      let files = []
      if (data.fileCreateDto != undefined && data.fileCreateDto.length > 0) {
        for (let i = 0; i < data.fileCreateDto.length; i++) {
          const sizeConvert = this.commonService.convertToSize(
            data.fileCreateDto[i].size
          )
          const newData = { ...data.fileCreateDto[i], size: sizeConvert }
          files = [...files, newData]
        }
      }
      if (receiveId) {
        const userReceive = await this.userService.searchUserById(
          data.receiveId
        )
        const isFriend = await this.chatService.isFriend(userId, receiveId)
        const notify = userReceive.settings.notify
        if (userReceive.settings.blockGuest && !isFriend) {
          this.server.emit('updatedSendThread', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Người dùng đã chặn nhận tin nhắn từ người lạ',
          })
          return
        }

        this.server.emit('updatedSendThread', {
          ...data,
          stoneId,
          timeThread: new Date(),
          user: sender,
          isReply: false,
          isRecall: false,
          messages: data.messages !== undefined ? data.messages : null,
          fileCreateDto: files,
          type: 'chat',
          notify,
        })
      } else if (channelId) {
        const notifications = []
        for (let i = 0; i < members.length; i++) {
          const userNoti = await this.userService.searchUserById(members[i])
          notifications.push({
            userId: members[i],
            notify: userNoti.settings.notify,
          })
        }
        //check mentions

        this.server.emit('updatedSendThread', {
          ...data,
          stoneId,
          timeThread: new Date(),
          user: sender,
          isReply: false,
          isRecall: false,
          fileCreateDto: files,
          notifications,
          type: 'channel',
        })
      } else {
        //my cloud
        this.server.emit('updatedSendThread', {
          ...data,
          stoneId,
          timeThread: new Date(),
          user: sender,
          isReply: false,
          isRecall: false,
          fileCreateDto: files,
          type: 'cloud',
        })
      }

      //handle after return data
      if (receiveId && (!chatId || chatId === '')) {
        const chatExist = await this.chatService.getChatById(chatId, userId)
        if (!chatExist) {
          this.handleCreateChat({ receiveId, messages, fileCreateDto }, req)
          return
        }
      } else {
        await this.threadService.createThread(
          messages,
          fileCreateDto,
          userId,
          receiveId,
          channelId,
          chatId,
          replyId,
          stoneId,
          cloudId,
          mentions
        )
      }
    }
  }

  /**
   * @param data:{
   * threadId:string
   * messages:MessageCreateDto
   * fileCreateDto:FileCreateDto[]
   * receiveId:string
   * channelId:string
   * chatId:string
   * }
   * @param req: token
   * @returns
   * status: pass
   */
  @SubscribeMessage('updateThread')
  @UseGuards(AuthGuard)
  async handleSendUpdateThread(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('updatedSendThread', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const {
        stoneId,
        messages,
        pin,
        type,
        id, //handle id before send to server id maybe is chatId or channelId
      }: {
        stoneId: string
        type: string
        id: string
        messages?: MessageCreateDto
        pin?: boolean
      } = data

      this.server.emit('updatedSendThread', {
        ...data,
        typeMsg: 'update',
      })

      console.time('updateThread')
      const rs = await this.threadService.updateThread(
        stoneId,
        req.user.id,
        messages,
        pin
      )
      if (rs) {
        if (type === 'chat') {
          await this.chatService.updateCacheChat(id, req.user.id)
        } else {
          await this.channelService.updateCacheChannel(id, stoneId)
        }
        console.timeEnd('updateThread')
      }
    }
  }

  /**
   * @param data:// {
//     "stoneId": "660bc6fc2190416551808733",
//     "receiveId":"65bceb94ceda5567efc0b629",
//     "type": "chat"
// }
   * @param req: token
   * @returns
   * status: pass
   */
  @SubscribeMessage('recallSendThread')
  @UseGuards(AuthGuard)
  async handleRecallThread(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    const {
      stoneId,
      type,
      chatId,
      channelId,
      cloudId,
    }: {
      stoneId: string
      receiveId?: string
      type: string
      typeRecall: string
      chatId?: string
      channelId?: string
      cloudId?: string
    } = data
    this.server.emit('updatedSendThread', {
      ...data,
      typeMsg: 'recall',
      messages: {
        message: 'Tin nhắn đã bị thu hồi',
        isRecall: true,
      },
    })

    await this.threadService.recallSendThread(
      stoneId,
      req.user.id,
      type,
      chatId,
      channelId,
      cloudId
    )
  }

  /**
   * @param data:// {
//     "stoneId": "660bc6fc2190416551808733",
//     "receiveId": "65bceb94ceda5567efc0b629",
//     "type": "chat"
// }
   * @param req: token
   * @returns
   * status: pass
   */
  @SubscribeMessage('deleteThread')
  @UseGuards(AuthGuard)
  async handleDeleteThread(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    const {
      stoneId,
      type,
      chatId,
      channelId,
      cloudId,
    }: {
      stoneId: string
      receiveId?: string
      type: string
      chatId?: string
      channelId?: string
      cloudId?: string
    } = data

    this.server.emit('updatedSendThread', {
      ...data,
      typeMsg: 'delete',
    })

    await this.threadService.deleteThread(
      stoneId,
      req.user.id,
      type,
      chatId,
      channelId,
      cloudId
    )
  }

  /**
   * @param data:{
    "emoji":"smile",
    "quantity":10,
    "threadId": "66096fa1c121006ac2eb88db",
    "receiveId":"65bceb94ceda5567efc0b629",
    "typeEmoji":"add"
}
   * @param req: token
   * @returns
   * status: pass
   */

  @SubscribeMessage('typing')
  @UseGuards(AuthGuard)
  async handleTyping(@MessageBody() data: any, @Req() req: any): Promise<void> {
    if (req.error) {
      this.server.emit('updatedTyping', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      this.server.emit('typing', {
        ...data,
        user: this.commonService.deleteField(req.user, []),
      })
    }
  }

  @SubscribeMessage('emoji')
  @UseGuards(AuthGuard)
  async handleaddEmoji(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('updatedEmojiThread', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const {
        emoji,
        quantity,
        stoneId,
        receiveId,
        members,
        typeEmoji,
      }: {
        emoji: string
        quantity: number
        stoneId: string
        receiveId?: string
        members?: string[]
        typeEmoji: string
      } = data

      if (receiveId) {
        this.server.emit('updatedEmojiThread', {
          ...data,
          type: 'chat',
          typeEmoji,
        })
      } else {
        this.server.emit('updatedEmojiThread', {
          ...data,
          members,
          type: 'channel',
          typeEmoji,
        })
      }
      if (typeEmoji === 'add') {
        await this.threadService.addEmoji(emoji, quantity, stoneId, req.user.id)
      } else {
        await this.threadService.removeEmoji(emoji, stoneId, req.user.id)
      }
    }
  }

  /**
   *
   * @param data :{
   * name: string,
   * members: string[] // array of userId
   * }
   * @param req: token
   * @returns: channel
   * status: pass
   */
  @SubscribeMessage('createChannel')
  @UseGuards(AuthGuard)
  async handleCreateChannel(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const members = [...new Set([...data.members, req.user.id])]
      if (members.length < 3) {
        this.server.emit('channelWS', {
          status: HttpStatus.BAD_REQUEST,
          message: 'Nhóm phải có ít nhất 3 người',
        })
      } else if (data.name === '') {
        this.server.emit('channelWS', {
          status: HttpStatus.BAD_REQUEST,
          message: 'Tên nhóm không được để trống',
        })
      } else if (data.name.length > 50) {
        this.server.emit('channelWS', {
          status: HttpStatus.BAD_REQUEST,
          message: 'Tên nhóm không được quá 50 ký tự',
        })
      } else {
        const channelCreateDto = {
          name: data.name,
          userCreated: req.user.id,
          members,
        }

        console.time('createChannel')
        const rs = await this.channelService.createChannel(channelCreateDto)
        console.timeEnd('createChannel')

        if (rs) {
          const usersRes = await Promise.all(
            rs.users.map(async (item) => {
              const user = await this.userService.searchUserById(item.id)
              return this.commonService.deleteField(
                { ...user, role: item.role },
                ['chatIds', 'settings']
              )
            })
          )

          this.server.emit('channelWS', {
            status: HttpStatus.CREATED,
            message: 'Create channel success',
            data: {
              ...rs,
              users: usersRes,
              type: 'channel',
            },
          })
          await this.channelService.updatedCacheChannels(
            ChannelType.CreateChannel,
            req.user.id
          )
        } else {
          this.server.emit('channelWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Create channel fail',
          })
        }
      }
    }
  }

  /**
   * @param data :{
   * channelId: string
   * channelUpdate: {
   * name: string,
   * }
   * }
   * @param req: token
   * @returns channel
   * status: pass
   */
  @SubscribeMessage('updateChannel')
  @UseGuards(AuthGuard)
  async handleUpdateChannel(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      console.time('updateChannel')
      const stoneId = uuidv4()

      const rs = await this.channelService.updateChannel(
        data.channelId,
        req.user.id,
        data.channelUpdate,
        stoneId
      )
      console.timeEnd('updateChannel')

      if (rs.error) {
        this.server.emit('channelWS', {
          status: HttpStatus.UNAUTHORIZED,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('channelWS', {
            status: HttpStatus.OK,
            message: 'Update channel success',
            data: {
              type: ChannelType.UpdateChannel,
              channel: {
                ...rs,
                type: 'channel',
              },
            },
          })
          await this.channelService.updateCacheChannel(data.channelId)
          await this.channelService.updatedCacheChannels('', req.user.id)
        } else {
          this.server.emit('channelWS', {
            status: HttpStatus.NOT_FOUND,
            message: 'Channel not found',
          })
        }
      }
    }
  }

  /**
   * @param data:{channelId:string}
   * @param req:token
   * @returns: users:string[], type:string
   * status: pass
   */

  @SubscribeMessage('deleteChannel')
  @UseGuards(AuthGuard)
  async handleDeleteChannel(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to delete this channel',
      })
    } else {
      console.time('deleteChannel')
      const rs = await this.channelService.deleteChannel(
        data.channelId,
        req.user.id
      )
      console.timeEnd('deleteChannel')

      if (rs.error) {
        this.server.emit('channelWS', {
          status: HttpStatus.UNAUTHORIZED,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('channelWS', {
            status: HttpStatus.OK,
            message: 'Delete channel success',
            data: {
              type: ChannelType.DeleteChannel,
              channel: {
                ...rs,
                type: 'channel',
              },
            },
          })
          await this.channelService.updatedCacheChannels(
            ChannelType.DeleteChannel,
            data.channelId
          )
        } else {
          this.server.emit('channelWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Failed to delete channel',
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * channelId:string,
   * users:UserOfChannel[{
   * id:string,
   * role:string
   * }]
   * }
   * @param req: token
   * @returns {users:string[], type:string, usersAdded:User[]}
   * status: pass
   */

  @SubscribeMessage('addUserToChannel')
  @UseGuards(AuthGuard)
  async handleAddUserToChannel(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to add user to this channel',
      })
    } else {
      console.time('addUserToChannel')
      const stoneId = uuidv4()
      const rs = await this.channelService.addUserToChannel(
        data.channelId,
        data.users,
        req.user.id,
        stoneId
      )
      console.timeEnd('addUserToChannel')
      if (rs.error) {
        this.server.emit('channelWS', {
          status: HttpStatus.UNAUTHORIZED,
          message: rs.error,
          userBlock: rs.userBlocked,
        })
      } else {
        if (rs) {
          this.server.emit('channelWS', {
            status: HttpStatus.OK,
            message: 'Add user to channel success',
            data: {
              type: ChannelType.AddUserToChannel,
              channel: {
                ...rs,
                type: 'channel',
              },
            },
          })
          await this.channelService.updateCacheChannel(data.channelId, stoneId)
          await this.channelService.updatedCacheChannels('', req.user.id)
        } else {
          this.server.emit('channelWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Add user to channel fail',
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * channelId:string,
   * users:string[]
   * }
   * @param req:token
   * @returns {channel:Channel, type:string}
   * status: pass
   */
  @SubscribeMessage('removeUserFromChannel')
  @UseGuards(AuthGuard)
  async handleRemoveUserFromChannel(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to remove user from this channel',
      })
    } else {
      console.time('removeUserFromChannel')
      const stoneId = uuidv4()
      const rs = await this.channelService.removeUserFromChannel(
        data.channelId,
        req.user.id,
        data.userId,
        stoneId
      )
      console.timeEnd('removeUserFromChannel')
      if (rs.error) {
        this.server.emit('channelWS', {
          status: HttpStatus.UNAUTHORIZED,
          message: rs.error,
        })
      } else {
        if (rs) {
          const members = rs.users.map((item) => item.id)
          this.server.emit('channelWS', {
            status: HttpStatus.OK,
            message: 'Remove user from channel success',
            data: {
              type: ChannelType.RemoveUserFromChannel,
              channel: {
                ...rs,
                type: 'channel',
              },
              members,
              removeMember: data.userId,
            },
          })
          await this.channelService.updateCacheChannel(data.channelId, stoneId)
          await this.channelService.updatedCacheChannels('', req.user.id)
        } else {
          this.server.emit('channelWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Remove user from channel fail',
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * channelId:string,
   * user:{id, role}:UserOfChannel
   * }
   * @param req:token
   * stuck: dont have ui test
   *
   */
  @SubscribeMessage('updateRoleUserInChannel')
  @UseGuards(AuthGuard)
  async handleUpdateRoleUserInChannel(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to update role of this user',
      })
    } else {
      console.time('updateRoleUserInChannel')
      const stoneId = uuidv4()
      const rs = await this.channelService.updateRoleUserInChannel(
        data.channelId,
        data.user,
        req.user.id,
        stoneId
      )
      console.timeEnd('updateRoleUserInChannel')
      if (rs.error) {
        this.server.emit('channelWS', {
          status: HttpStatus.UNAUTHORIZED,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('channelWS', {
            status: HttpStatus.OK,
            message: 'Update role user in channel success',
            data: {
              type: ChannelType.UpdateRoleUserInChannel,
              channel: {
                ...rs,
                type: 'channel',
              },
            },
          })
          await this.channelService.updateCacheChannel(data.channelId, stoneId)
          await this.channelService.updatedCacheChannels('', req.user.id)
        } else {
          this.server.emit('channelWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Update role user in channel fail',
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * channelId:string,
   * transferOwner?:string
   * }
   * @param req: token
   * @return {channel:Channel, type:string}
   * status: pass
   */
  @SubscribeMessage('leaveChannel')
  @UseGuards(AuthGuard)
  async handleLeaveChannel(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to leave this channel',
      })
    } else {
      console.time('leaveChannel')
      const stoneId = uuidv4()
      const rs = await this.channelService.leaveChannel(
        data.channelId,
        req.user.id,
        data.transferOwner
      )
      console.timeEnd('leaveChannel')
      if (rs.error) {
        this.server.emit('channelWS', {
          status: rs.status,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('channelWS', {
            status: HttpStatus.OK,
            message: 'Leave channel success',
            data: {
              type: ChannelType.LeaveChannel,
              channel: {
                ...rs,
                type: 'channel',
              },
              userLeave: req.user.id,
            },
          })
          await this.channelService.updateCacheChannel(data.channelId, stoneId)
          await this.channelService.updatedCacheChannels('', req.user.id)
        } else {
          this.server.emit('channelWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Leave channel fail',
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * receiveId:string
   * messages?:MessageCreateDto
   * fileCreateDto?:FileCreateDto[]
   * }
   * @param req: token
   * @returns chat
   * status: pass
   */
  @SubscribeMessage('createChat')
  @UseGuards(AuthGuard)
  async handleCreateChat(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const stoneId = uuidv4()

      const userCreate = await this.userService.searchUserById(data.receiveId)
      if (userCreate.settings.blockGuest) {
        this.server.emit('chatWS', {
          status: HttpStatus.BAD_REQUEST,
          message: 'Người dùng đã chặn nhận tin nhắn từ người lạ',
        })
        return
      }
      const rs = await this.chatService.createChat(req.user.id, data, stoneId)
      if (rs.error) {
        this.server.emit('chatWS', {
          status: HttpStatus.BAD_REQUEST,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('chatWS', {
            status: HttpStatus.CREATED,
            message: 'Create chat success',
            data: rs,
            noti: userCreate.noti,
          })
          await this.chatService.updateCacheChats(req.user.id)
          await this.userService.updateCacheUser()

          await this.chatService.updateCacheChat(rs.id, req.user.id)
        } else {
          this.server.emit('chatWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Create chat fail',
            noti: userCreate.noti,
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * receiveId:string
   * }
   * @param req: token
   * @returns: { receiveId: data.receiveId, chat: rs }
   * status: pass
   */
  @SubscribeMessage('reqAddFriend')
  @UseGuards(AuthGuard)
  async handleReqAddFriend(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const rs = await this.chatService.reqAddFriend(
        data.receiveId,
        req.user.id
      )
      if (rs.error) {
        this.server.emit('chatWS', {
          status: rs.status,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('chatWS', {
            status: HttpStatus.OK,
            message: 'Request friend success',
            data: {
              receiveId: data.receiveId,
              chat: rs,
              type: 'reqAddFriend',
              senderId: req.user.id,
            },
          })
          await this.chatService.updateCacheChats(req.user.id)
          await this.userService.updateCacheUser()
        } else {
          this.server.emit('chatWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Request friend fail',
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * chatId:string
   * }
   * @param req: token
   * @returns
   * status: pass
   * @description: Unrequest add friend
   */
  @SubscribeMessage('unReqAddFriend')
  @UseGuards(AuthGuard)
  async handleUnReqAddFriend(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const rs = await this.chatService.unReqAddFriend(data.chatId, req.user.id)
      if (rs.error) {
        this.server.emit('chatWS', {
          status: rs.status,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('chatWS', {
            status: HttpStatus.OK,
            message: 'Unrequest friend success',
            data: {
              type: 'unReqAddFriend',
              chat: rs,
              receiveId:
                rs.receiveId === req.user.id ? rs.senderId : rs.receiveId,
              senderId: req.user.id,
            },
          })
          await this.chatService.updateCacheChats(req.user.id)
          await this.userService.updateCacheUser()
        } else {
          this.server.emit('chatWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Unrequest friend fail',
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * chatId:string
   * receiveId:string
   * }
   * @param req: token
   * @returns:{ receiveId: data.receiveId, user: rs }
   * status: pass
   */

  @SubscribeMessage('reqAddFriendHaveChat')
  @UseGuards(AuthGuard)
  async handleReqAddFriendHaveChat(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      if (data.receiveId === req.user.id) {
        this.server.emit('chatWS', {
          status: HttpStatus.BAD_REQUEST,
          message: 'You can not add yourself',
        })
        return
      }
      const rs = await this.chatService.reqAddFriendHaveChat(
        data.chatId,
        data.receiveId
      )

      if (rs.error) {
        this.server.emit('chatWS', {
          status: rs.status,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('chatWS', {
            status: HttpStatus.OK,
            message: 'Request friend success',
            data: {
              receiveId: data.receiveId,
              senderId: req.user.id,
              chat: rs,
              type: 'reqAddFriendHaveChat',
            },
          })
          await this.chatService.updateCacheChats(req.user.id)
          await this.userService.updateCacheUser()
        } else {
          this.server.emit('chatWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Request friend fail',
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * chatId:string
   * }
   * @param req: token
   * @returns
   * status: pass
   */
  @SubscribeMessage('acceptAddFriend')
  @UseGuards(AuthGuard)
  async handleAcceptAddFriend(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const rs = await this.chatService.acceptAddFriend(
        data.chatId,
        req.user.id
      )
      if (rs.error) {
        this.server.emit('chatWS', {
          status: rs.status,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('chatWS', {
            status: HttpStatus.OK,
            message: 'Accept friend success',
            data: {
              type: 'acceptAddFriend',
              chat: rs,
              senderId: req.user.id,
              receiveId:
                rs.receiveId === req.user.id ? rs.senderId : rs.receiveId,
            },
          })
          await this.chatService.updateCacheChats(req.user.id)
          await this.userService.updateCacheUser()
          await this.chatService.updateListFriend()
        } else {
          this.server.emit('chatWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Accept friend fail',
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * chatId:string
   * }
   * @param req: token
   * @returns
   * status: pass
   */
  @SubscribeMessage('rejectAddFriend')
  @UseGuards(AuthGuard)
  async handleRejectAddFriend(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const rs = await this.chatService.rejectAddFriend(
        data.chatId,
        req.user.id
      )

      if (rs.error) {
        this.server.emit('chatWS', {
          status: rs.status,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('chatWS', {
            status: HttpStatus.OK,
            message: 'Reject friend success',
            data: {
              type: 'rejectAddFriend',
              chat: rs,
              senderId: req.user.id,
            },
          })
          await this.chatService.updateCacheChats(req.user.id)
          await this.userService.updateCacheUser()
        } else {
          this.server.emit('chatWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Reject friend fail',
          })
        }
      }
    }
  }

  /**
   * @param data:{
   * chatId:string
   * }
   * @param req: token
   * @returns
   * status: pass
   */
  @SubscribeMessage('unfriend')
  @UseGuards(AuthGuard)
  async handleUnfriend(
    @MessageBody() data: any,
    @Req() req: any
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const rs = await this.chatService.unfriend(data.chatId)
      if (rs.error) {
        this.server.emit('chatWS', {
          status: rs.status,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('chatWS', {
            status: HttpStatus.OK,
            message: 'Unfriend success',
            data: {
              type: 'unfriend',
              chat: rs,
              senderId: req.user.id,
              receiveId:
                rs.receiveId === req.user.id ? rs.senderId : rs.receiveId,
            },
          })
          await this.chatService.updateCacheChats(req.user.id)
          await this.userService.updateCacheUser()
          await this.chatService.updateListFriend()
        } else {
          this.server.emit('chatWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Unfriend fail',
          })
        }
      }
    }
  }
}
