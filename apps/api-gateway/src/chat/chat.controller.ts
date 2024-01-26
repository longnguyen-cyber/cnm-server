import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';

import { CustomValidationPipe } from '@app/common';

@ApiTags('chats')
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  // @ApiBody({ type:  })
  @UsePipes(new CustomValidationPipe())
  async createChat(
    @Body('senderId') senderId: string,
    @Body('receiveId') receiveId: string,
  ) {
    return this.chatService.createChat({
      senderId,
      receiveId,
    });
  }

  @Get()
  async getAllChats() {
    return this.chatService.getAllChat();
  }
}
