import {
  Body,
  CACHE_MANAGER,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Response } from 'src/common/common.type'
import { AuthGuard } from '../auth/guard/auth.guard'
import { ChannelService } from './channel.service'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'
import { ChannelCreateDto } from './dto/ChannelCreate.dto'
import { UserOfChannel } from './dto/UserOfChannel.dto'
import { Cache } from 'cache-manager'

@Controller('channels')
@UseGuards(AuthGuard)
export class ChannelController {
  constructor(
    private readonly channelService: ChannelService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // @Post('/insert')
  // async insert() {
  //   try {
  //     // this.update()
  //     const cachedData = await this.cacheManager.get('insert')
  //     if (cachedData) console.log('cachedData', cachedData)
  //     else {
  //       const data = 'insert'
  //       await this.cacheManager.set('insert', data, { ttl: 60 * 60 * 24 * 30 })
  //       console.log('insert', cachedData)
  //     }
  //   } catch (error) {
  //     console.error('Error writing to cache:', error)
  //   }
  // }
  // @Post('/get')
  // async get() {
  //   // console.log('get', await this.cacheManager.get('insert'))
  //   return this.cacheManager.get('insert')
  // }

  // @Post('/update')
  // async update() {
  //   const data = 'update333'
  //   await this.cacheManager.set('insert', data, { ttl: 60 * 60 * 24 * 30 })
  //   console.log('update', await this.cacheManager.get('insert'))
  //   return true
  // }

  @Get(':threadId/thread')
  @UseGuards(AuthGuard)
  async getThread(@Param('threadId') threadId: string, @Req() req: any) {
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not allowed to access this resource',
      }
    } else {
      const thread = await this.channelService.getThread(threadId, req.user.id)
      if (!thread) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Thread not found',
        }
      }
      return {
        status: HttpStatus.OK,
        message: 'Get thread success',
        data: thread,
      }
    }
  }
  @Get()
  async getAllChannel(@Req() req: any): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not allowed to access this resource',
      }
    } else
      return {
        status: HttpStatus.OK,
        message: 'Get all channel success',
        data: await this.channelService.getAllChannel(req.user.id),
      }
  }
  @Get(':channelId')
  async getChannelById(
    @Param('channelId') channelId: string,
    @Req() req: any,
  ): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'You are not allowed to access this resource',
      }
    } else {
      const channel = await this.channelService.getChannelById(
        channelId,
        req.user.id,
      )
      if (!channel) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Channel not found',
        }
      }
      return {
        status: HttpStatus.OK,
        message: 'Get channel success',
        data: channel,
      }
    }
  }

  @Get(':channelId/members')
  async getMembersOfChannel(
    @Param('channelId') channelId: string,
  ): Promise<any> {
    return await this.channelService.getMembersOfChannel(channelId)
  }
}
