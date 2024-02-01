import {
  Chat,
  ChatCreateDto,
  ChatServiceController,
  ChatServiceControllerMethods,
  Chats,
} from '@app/common';
import { Controller } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';

@Controller('chat')
@ChatServiceControllerMethods()
export class ChatController implements ChatServiceController {
  constructor(private readonly chatService: ChatService) {}
  createChat(request: ChatCreateDto): Chat | Observable<Chat> | Promise<Chat> {
    return this.chatService.createChat(request);
  }
  async getAllChats(): Promise<Chats> {
    const chats = await this.chatService.getAllChat();
    return { chats };
  }
}
