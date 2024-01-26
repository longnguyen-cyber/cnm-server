import {
  CHAT_SERVICE_NAME,
  Chat,
  ChatCreateDto,
  ChatServiceClient,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { CHAT_SERVICE } from './constants';

@Injectable()
export class ChatService implements OnModuleInit {
  private chatService: ChatServiceClient;
  constructor(@Inject(CHAT_SERVICE) private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.chatService =
      this.client.getService<ChatServiceClient>(CHAT_SERVICE_NAME);
  }

  async createChat(chatCreateDto: ChatCreateDto): Promise<Chat | any> {
    return this.chatService.createChat(chatCreateDto);
  }

  async getAllChat(): Promise<Chat[] | any> {
    return this.chatService.getAllChats({});
  }
}
