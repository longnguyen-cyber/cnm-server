import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Response } from 'src/common/common.type'
import { AuthGuard } from '../auth/guard/auth.guard'
import { ChatService } from './chat.service'

@ApiTags('chats')
@Controller('chats')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(
    @Body('receiveId') receiveId: string,
    @Req() req: any,
  ): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      }
    }

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
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      }
    }
    return {
      status: HttpStatus.OK,
      message: 'Get all chat success',
      data: await this.chatService.getAllChat(req.user.id),
    }
  }

  @Get(':chatId')
  async getChatById(
    @Param('chatId') chatId: string,
    @Req() req: any,
  ): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      }
    }
    const chat = await this.chatService.getChatById(chatId, req.user.id)
    if (chat) {
      return {
        status: HttpStatus.OK,
        message: 'Get chat success',
        data: chat,
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Not found chat',
      }
    }
  }

  @Put(':chatId/unfriend')
  async unfriend(
    @Param('chatId') chatId: string,
    @Req() req: any,
  ): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      }
    }
    const data = await this.chatService.unfriend(chatId, req.user.id)
    if (data) {
      return {
        status: HttpStatus.OK,
        message: 'Unfriend success',
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Unfriend fail',
      }
    }
  }
}
