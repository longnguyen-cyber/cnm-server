import { Body, Controller, Get, Param, Post, UsePipes } from '@nestjs/common';
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
    @Body('chat') chat: string,
    @Body('senderId') senderId: string,
    @Body('receiveId') receiveId: string,
  ) {
    return this.chatService.createChat({
      chatId: chat,
      senderId,
      receiveId,
    });
  }

  @Get()
  async getAllChats() {
    return this.chatService.getAllChat();
  }

  @Get(':chatId')
  async getChatById(@Param('chatId') chatId: string) {
    const chat = await this.chatService.getChatById({ chatId });
    return {
      success: true,
      message: 'Get chat success',
      errors: null,
      data: chat,
    };
  }
}
