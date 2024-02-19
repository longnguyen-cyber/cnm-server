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
import { ThreadService } from '../thread/thread.service'
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private threadService: ThreadService) {}
  user = []
  @WebSocketServer() server: Server

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

  @SubscribeMessage('sendThread')
  async handleSendThread(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ): Promise<void> {
    const isAuthenticated = socket.handshake.auth
    const {
      messages,
      fileCreateDto,
      userId,
      receiveId,
      channelId,
      chatId,
    }: {
      messages?: MessageCreateDto
      fileCreateDto?: FileCreateDto[]
      userId?: string
      receiveId?: string
      channelId?: string
      chatId?: string
    } = data
    const rs = await this.threadService.createThread(
      messages,
      fileCreateDto,
      userId,
      receiveId,
      channelId,
      chatId,
    )
    this.server.emit('sendThread', { ...data, id: rs.id })
  }

  @SubscribeMessage('updateThread')
  async handleSendUpdateThread(@MessageBody() data: any): Promise<void> {
    const {
      threadId,
      senderId,
      messages,
      files,
    }: {
      threadId: string
      senderId: string
      messages?: MessageCreateDto
      files?: FileCreateDto[]
    } = data
    await this.threadService.updateThread(threadId, senderId, messages, files)
    this.server.emit('updateThread', data)
  }
  @SubscribeMessage('deleteThread')
  async handleDeleteThread(@MessageBody() data: any): Promise<void> {
    const { threadId, senderId } = data
    const rs = await this.threadService.deleteThread(threadId, senderId)
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
    await this.threadService.addReact(react, quantity, threadId, senderId)
    this.server.emit('addReact', true)
  }
}
