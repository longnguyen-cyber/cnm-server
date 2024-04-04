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
import { AuthGuard } from '../auth/guard/auth.guard'
import { ChannelService } from '../channel/channel.service'
import { ChatService } from '../chat/chat.service'
import { CommonService } from '../common/common.service'
import { FileCreateDto } from '../thread/dto/fileCreate.dto'
import { MessageCreateDto } from '../thread/dto/messageCreate.dto'
import { ThreadService } from '../thread/thread.service'
import { v4 as uuidv4 } from 'uuid'

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
  ) {}
  user = []
  @WebSocketServer() server: Server

  @UseGuards(AuthGuard)
  handleConnection(@ConnectedSocket() socket: Socket) {
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
      (item) => item.userId !== isAuthenticated.userId,
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
    @Req() req: any,
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
        replyId,
      }: {
        messages?: MessageCreateDto
        fileCreateDto?: FileCreateDto[]
        receiveId?: string
        channelId?: string
        chatId?: string
        replyId?: string
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

      console.log('data', data)
      //retrun data immediately
      if (receiveId) {
        this.server.emit('updatedSendThread', {
          ...data,
          stoneId,
          timeThread: new Date(),
          user: sender,
          isReply: false,
          isRecall: false,
          type: 'chat',
        })
      } else {
        this.server.emit('updatedSendThread', {
          ...data,
          stoneId,
          timeThread: new Date(),
          user: sender,
          isReply: false,
          isRecall: false,
          type: 'channel',
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
  async handleSendUpdateThread(@MessageBody() data: any): Promise<void> {
    const {
      threadId,
      senderId,
      messages,
      files,
      chatId,
      channelId,
    }: {
      threadId: string
      senderId: string
      messages?: MessageCreateDto
      files?: FileCreateDto[]
      chatId?: string
      channelId?: string
    } = data
    await this.threadService.updateThread(
      threadId,
      senderId,
      messages,
      files,
      chatId,
      channelId,
    )
    this.server.emit('updatedSendThread', data)
  }

  /**
   * @param data:{
   * threadId:string
   * userId:string
   * messages:MessageCreateDto
   * fileCreateDto:FileCreateDto[]
   * chatId:string
   * channelId:string
   * }
   * @param req: token
   * @returns
   * status: pass
   */
  @SubscribeMessage('replyThread')
  @UseGuards(AuthGuard)
  async handleReplyThread(@MessageBody() data: any): Promise<void> {
    const {
      threadId,
      userId,
      messages,
      files,
      chatId,
      channelId,
    }: {
      threadId: string
      userId: string
      messages?: MessageCreateDto
      files?: FileCreateDto[]
      chatId?: string
      channelId?: string
    } = data
    const rs = await this.threadService.createReplyThread(
      threadId,
      userId,
      messages,
      files,
      channelId,
      chatId,
    )

    if (chatId) {
      this.server.emit('updatedSendThread', { ...data, id: rs.id })
    } else {
      this.server.emit('updatedSendThread', {
        ...data,
        id: rs.id,
        members: rs.dataReturn.users,
      })
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
    @Req() req: any,
  ): Promise<void> {
    const {
      stoneId,
      type,
    }: {
      stoneId: string
      receiveId?: string
      type: string
    } = data
    const rs = await this.threadService.threadExists(stoneId, req.user.id, type)
    if (rs) {
      this.server.emit('updatedSendThread', {
        ...data,
        typeMsg: 'recall',
      })

      await this.threadService.recallSendThread(stoneId, req.user.id, type)
    }
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
    @Req() req: any,
  ): Promise<void> {
    const {
      stoneId,
      type,
    }: {
      stoneId: string
      receiveId?: string
      type: string
    } = data

    const rs = await this.threadService.threadExists(stoneId, req.user.id, type)
    if (rs) {
      this.server.emit('updatedSendThread', {
        ...data,
        typeMsg: 'delete',
      })

      await this.threadService.deleteThread(stoneId, req.user.id, type)
    }
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
  @SubscribeMessage('emoji')
  @UseGuards(AuthGuard)
  async handleaddEmoji(
    @MessageBody() data: any,
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('updatedSendThread', {
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
        this.server.emit('updatedSendThread', {
          ...data,
          receiveId,
          type: 'chat',
          typeEmoji,
        })
      } else {
        this.server.emit('updatedSendThread', {
          ...data,
          members,
          type: 'channel',
          typeEmoji,
        })
      }
      if (typeEmoji === 'add') {
        await this.threadService.addEmoji(emoji, quantity, stoneId, req.user.id)
      } else {
        await this.threadService.removeEmoji(stoneId, req.user.id)
      }
    }
  }

  /**
   *
   * @param data :{
   * name: string,
   * members: string[] // array of userId
   * isPublic: boolean
   * }
   * @param req: token
   * @returns: channel
   * status: pass
   */
  @SubscribeMessage('createChannel')
  @UseGuards(AuthGuard)
  async handleCreateChannel(
    @MessageBody() data: any,
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const members = [...new Set([...data.members, req.user.id])]
      if (members.length < 2) {
        this.server.emit('channelWS', {
          status: HttpStatus.BAD_REQUEST,
          message: 'Nhóm phải có ít nhất 2 người',
        })
      } else if (data.name === '') {
        this.server.emit('channelWS', {
          status: HttpStatus.BAD_REQUEST,
          message: 'Tên nhóm không được để trống',
        })
      } else {
        const channelCreateDto = {
          name: data.name,
          isPublic: data.isPublic,
          userCreated: req.user.id,
          members,
        }
        const rs = await this.channelService.createChannel(
          channelCreateDto,
          req.user.id,
        )

        if (rs) {
          this.server.emit('channelWS', {
            status: HttpStatus.CREATED,
            message: 'Create channel success',
            data: {
              ...rs,
              type: 'channel',
            },
          })
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
   * isPublic: boolean
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
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const rs = await this.channelService.updateChannel(
        data.channelId,
        req.user.id,
        data.channelUpdate,
      )
      if (rs) {
        this.server.emit('channelWS', {
          status: HttpStatus.OK,
          message: 'Update channel success',
          data: {
            type: 'updateChannel',
            channel: {
              ...rs,
              type: 'channel',
            },
          },
        })
      } else {
        this.server.emit('channelWS', {
          status: HttpStatus.NOT_FOUND,
          message: 'Channel not found',
        })
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
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to delete this channel',
      })
    } else {
      const rs = await this.channelService.deleteChannel(
        data.channelId,
        req.user.id,
      )
      if (rs) {
        this.server.emit('channelWS', {
          status: HttpStatus.OK,
          message: 'Delete channel success',
          data: {
            type: 'deleteChannel',
            channel: {
              ...rs,
              type: 'channel',
            },
          },
        })
      } else {
        this.server.emit('channelWS', {
          status: HttpStatus.BAD_REQUEST,
          message: 'Failed to delete channel',
        })
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
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to add user to this channel',
      })
    } else {
      const rs = await this.channelService.addUserToChannel(
        data.channelId,
        data.users,
        req.user.id,
      )
      if (rs.error) {
        this.server.emit('channelWS', {
          status: HttpStatus.UNAUTHORIZED,
          message: rs.error,
        })
      } else {
        if (rs) {
          this.server.emit('channelWS', {
            status: HttpStatus.OK,
            message: 'Add user to channel success',
            data: {
              type: 'addUserToChannel',
              channel: {
                ...rs,
                type: 'channel',
              },
            },
          })
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
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to remove user from this channel',
      })
    } else {
      const rs = await this.channelService.removeUserFromChannel(
        data.channelId,
        req.user.id,
        data.users,
      )
      if (rs.error) {
        this.server.emit('channelWS', {
          status: HttpStatus.UNAUTHORIZED,
          message: rs.error,
        })
      } else {
        if (rs) {
          const members = rs.users.map((item) => item.id).concat(data.users)
          this.server.emit('channelWS', {
            status: HttpStatus.OK,
            message: 'Remove user from channel success',
            data: {
              type: 'removeUserFromChannel',
              channel: {
                ...rs,
                type: 'channel',
              },
              members,
            },
          })
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
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to update role of this user',
      })
    } else {
      const rs = await this.channelService.updateRoleUserInChannel(
        data.channelId,
        data.user,
        req.user.id,
      )
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
              type: 'updateRoleUserInChannel',
              channel: {
                ...rs,
                type: 'channel',
              },
            },
          })
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
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('channelWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to leave this channel',
      })
    } else {
      const rs = await this.channelService.leaveChannel(
        data.channelId,
        req.user.id,
        data.transferOwner,
      )

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
              type: 'leaveChannel',
              channel: {
                ...rs,
                type: 'channel',
              },
              userLeave: req.user.id,
            },
          })
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
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const stoneId = uuidv4()

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
          })
        } else {
          this.server.emit('chatWS', {
            status: HttpStatus.BAD_REQUEST,
            message: 'Create chat fail',
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
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const rs = await this.chatService.reqAddFriend(
        data.receiveId,
        req.user.id,
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
    @Req() req: any,
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
    @Req() req: any,
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
        data.receiveId,
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
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const rs = await this.chatService.acceptAddFriend(
        data.chatId,
        req.user.id,
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
    @Req() req: any,
  ): Promise<void> {
    if (req.error) {
      this.server.emit('chatWS', {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      })
    } else {
      const rs = await this.chatService.rejectAddFriend(
        data.chatId,
        req.user.id,
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
    @Req() req: any,
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
