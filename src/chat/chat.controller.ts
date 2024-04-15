import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Response } from 'src/common/common.type'
import { AuthGuard } from '../auth/guard/auth.guard'
import { ChatService } from './chat.service'

@Controller('chats')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
      throw new HttpException('Not found chat', HttpStatus.NOT_FOUND)
      // return {
      //   status: HttpStatus.BAD_REQUEST,
      //   message: 'Not found chat',
      // }
    }
  }
  @Get(':chatId/updateCache')
  @UseGuards(AuthGuard)
  async updateCacheChat(
    @Param('chatId') chatId: string,
    @Req() req: any,
  ): Promise<Response> {
    await this.chatService.updateCacheChat(chatId, req.user.id)
    return {
      status: HttpStatus.OK,
      message: 'Update cache chat success',
    }
  }
  @Get(':receiveId/friendChatWaittingAccept')
  async getFriendChatWaittingAccept(
    @Param('receiveId') receiveId: string,
    @Req() req: any,
  ): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      }
    }
    const data = await this.chatService.getFriendChatWaittingAccept(
      receiveId,
      req.user.id,
    )
    if (data) {
      return {
        status: HttpStatus.OK,
        message: 'Get friend chat success',
        data,
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Get friend chat fail',
      }
    }
  }

  @Get('friend/whitelistFriendAccept')
  async whitelistFriendAccept(@Req() req: any): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      }
    }
    const data = await this.chatService.whitelistFriendAccept(req.user.id)
    if (data) {
      return {
        status: HttpStatus.OK,
        message: 'Whitelist friend success',
        data,
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Whitelist friend fail',
      }
    }
  }

  @Get('friend/waitlistFriendAccept')
  async waitlistFriendAccept(@Req() req: any): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      }
    }
    const data = await this.chatService.waitlistFriendAccept(req.user.id)
    if (data) {
      return {
        status: HttpStatus.OK,
        message: 'Waitlist friend success',
        data,
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Waitlist friend fail',
      }
    }
  }
  @Get('/search/:name')
  @UseGuards(AuthGuard)
  async search(
    @Param('name') name: string,
    @Req() req: any,
  ): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Please login again',
        errors: req.error,
      }
    }
    const users = await this.chatService.searchFriend(name, req.user.id)
    return {
      status: HttpStatus.OK,
      message: 'Search success',
      data: users,
    }
  }
}
