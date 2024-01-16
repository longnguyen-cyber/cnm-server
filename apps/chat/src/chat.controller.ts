import {
  Chat,
  ChatCreateDto,
  ChatServiceController,
  ChatServiceControllerMethods,
  Chats,
  FindOneChatDto,
} from '@app/common';
import { Controller } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service';

@Controller('chat')
@ChatServiceControllerMethods()
export class ChatController implements ChatServiceController {
  constructor(private readonly chatService: ChatService) {}
  createChat(request: ChatCreateDto): Chat | Observable<Chat> | Promise<Chat> {
    return this.chatService.createChat(
      request,
      request.receiveId,
      request.senderId,
    );
  }
  getAllChats(): Chats | Observable<Chats> | Promise<Chats> {
    return this.chatService.getAllChat();
  }
  getChatById(
    request: FindOneChatDto,
  ): Chat | Observable<Chat> | Promise<Chat> {
    return this.chatService.getChatById(request.chatId);
  }
}
