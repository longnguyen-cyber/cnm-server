import { ThreadService } from '../thread/thread.service'
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
import { FileCreateDto } from '../thread/dto/fileCreate.dto'
import { MessageCreateDto } from '../thread/dto/messageCreate.dto'
import { ReactCreateDto } from '../thread/dto/reactCreate.dto'
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private threadService: ThreadService) {}
  user = []
  @WebSocketServer() server: Server

  handleConnection(@ConnectedSocket() socket: Socket) {
    const isAuthenticated = socket.handshake.auth
    console.log('User connected')

    if (isAuthenticated) {
      this.user.push({ userId: isAuthenticated.userId })
      this.server.emit('online', this.user)
    }
  }
  handleDisconnect(@ConnectedSocket() socket: Socket) {
    const isAuthenticated = socket.handshake.auth
    console.log('User disconnected')
    this.user = this.user.filter(
      (item) => item.userId !== isAuthenticated.userId,
    )
    this.server.emit('online', this.user)
  }

  @SubscribeMessage('sendThread')
  async handleSendThread(@MessageBody() data: any): Promise<void> {
    const {
      messages,
      fileCreateDto,
      react,
      user,
      receiveId,
      channelId,
      chatId,
    }: {
      messages?: MessageCreateDto
      fileCreateDto?: FileCreateDto
      react?: ReactCreateDto
      user?: any
      receiveId?: string
      channelId?: string
      chatId?: string
    } = data
    const rs = await this.threadService.createThread(
      messages,
      fileCreateDto,
      react,
      user.id,
      receiveId,
      channelId,
      chatId,
    )
    this.server.emit('sendThread', { ...data, id: rs.thread.data.id })
  }

  @SubscribeMessage('updateThread')
  async handleSendUpdateThread(@MessageBody() data: any): Promise<void> {
    const {
      threadId,
      messageCreateDto,
      fileCreateDto,
      reactCreateDto,
      senderId,
      receiveId,
      channelId,
      chatId,
    }: {
      threadId: string
      messageCreateDto?: MessageCreateDto
      fileCreateDto?: FileCreateDto
      reactCreateDto?: ReactCreateDto
      senderId?: string
      receiveId?: string
      channelId?: string
      chatId?: string
    } = data
    await this.threadService.updateThread(
      threadId,
      messageCreateDto,
      fileCreateDto,
      reactCreateDto,
      senderId,
      receiveId,
      channelId,
      chatId,
    )
    this.server.emit('updateThread', data)
  }
  @SubscribeMessage('deleteThread')
  async handleDeleteThread(@MessageBody() data: any): Promise<void> {
    const { threadId, senderId } = data
    const rs = await this.threadService.recallSendThread(threadId, senderId)
    this.server.emit('deleteThread', rs)
  }
  @SubscribeMessage('addReact')
  async handleAddReact(@MessageBody() data: any): Promise<void> {
    const {
      react,
      quantity,
      threadId,
      senderId,
    }: {
      react: string
      quantity: number
      threadId: string
      senderId: string
    } = data
    console.log(data)
    await this.threadService.addReact(react, quantity, threadId, senderId)
    this.server.emit('addReact', null)
  }
}
