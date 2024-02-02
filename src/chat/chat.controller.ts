import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common'
import { ApiBody, ApiTags } from '@nestjs/swagger'
import { Response } from 'src/common/common.type'
import { AuthGuard } from '../auth/guard/auth.guard'
import { CustomValidationPipe } from '../common/common.pipe'
import { ChatService } from './chat.service'
import { ChatRequestCreateDto } from './dto/chatRequestCreate.dto'

@ApiTags('chats')
@Controller('chats')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiBody({ type: ChatRequestCreateDto })
  @UsePipes(new CustomValidationPipe())
  async createChat(
    @Body('receiveId') receiveId: string,
    @Req() req: any,
  ): Promise<Response> {
    const senderId = req.user.id
    const data = await this.chatService.createChat(senderId, receiveId)
    if (data) {
      return {
        status: HttpStatus.CREATED,
        message: 'Create chat success',
        data: data,
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Create chat fail',
      }
    }
  }

  @Get()
  async getAllChat(@Req() req: any): Promise<Response> {
    console.log(req.user)
    return {
      status: HttpStatus.OK,
      message: 'Get all chat success',
      data: await this.chatService.getAllChat(),
    }
  }

  @Get(':chatId')
  async getChatById(@Param('chatId') chatId: string): Promise<Response> {
    const chat = await this.chatService.getChatById(chatId)
    if (chat) {
      return {
        status: HttpStatus.OK,
        message: 'Get chat success',
        data: chat,
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Get chat fail',
      }
    }
  }
}
