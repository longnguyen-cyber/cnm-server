import {
  Body,
  Controller,
  Post,
  UsePipes,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatRequestCreateDto } from './dto/chatRequestCreate.dto';
import { CustomValidationPipe } from 'src/common/common.pipe';
import { ChatCreateDto } from './dto/ChatCreate.dto';
import { Request } from 'express';

@ApiTags('chats')
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiBody({ type: ChatRequestCreateDto })
  @UsePipes(new CustomValidationPipe())
  async createChat(
    @Body('chat') chat: ChatCreateDto,
    @Body('senderId') senderId: string,
    @Body('receiveId') receiveId: string,
  ) {
    return await this.chatService.createChat(chat, senderId, receiveId);
  }

  @Get()
  async getAllChat() {
    return await this.chatService.getAllChat();
  }

  @Get(':chatId')
  async getChatById(@Param('chatId') chatId: string, @Req() req: Request) {
    const chat = await this.chatService.getChatById(chatId, req);
    return {
      success: true,
      message: 'Get chat success',
      errors: null,
      data: chat,
    };
  }
}
