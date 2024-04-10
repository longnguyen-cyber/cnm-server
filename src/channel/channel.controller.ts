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

  // @Get('/insert')
  // async insert() {
  //   try {
  //     this.update()
  //     // const cachedData = await this.cacheManager.get('insert')
  //     // if (cachedData) console.log('cachedData', cachedData)
  //     // else {
  //     //   const data = 'insert'
  //     //   await this.cacheManager.set('insert', data, { ttl: 60 * 60 * 24 * 30 })
  //     //   console.log('insert', cachedData)
  //     // }
  //   } catch (error) {
  //     console.error('Error writing to cache:', error)
  //   }
  // }
  // @Get('/get')
  // async get() {
  //   // console.log('get', await this.cacheManager.get('insert'))
  //   return this.cacheManager.get('insert')
  // }

  // // @Post('/update')
  // async update() {
  //   const data = 'update333'
  //   await this.cacheManager.set('insert', data, { ttl: 60 * 60 * 24 * 30 })
  //   console.log('update', await this.cacheManager.get('insert'))
  //   return true
  // }
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

  // @Post()
  // async createChannel(
  //   @Body() channel: ChannelCreateDto,
  //   @Req() req: any,
  // ): Promise<Response> {
  //   if (req.error) {
  //     return {
  //       status: HttpStatus.FORBIDDEN,
  //       message: 'You are not allowed to access this resource',
  //     }
  //   }

  //   const channelCreateDto = {
  //     name: channel.name,
  //     isPublic: channel.isPublic,
  //     userCreated: req.user.id,
  //     members: channel.members.concat(req.user.id),
  //   }
  //   const data = await this.channelService.createChannel(channelCreateDto)
  //   if (data) {
  //     return {
  //       status: HttpStatus.CREATED,
  //       message: 'Create channel success',
  //       data: data,
  //     }
  //   } else {
  //     return {
  //       status: HttpStatus.BAD_REQUEST,
  //       message: 'Create channel fail',
  //     }
  //   }
  // }

  // @Put(':channelId')
  // async updateChannel(
  //   @Param('channelId') channelId: string,
  //   @Body() channelUpdate: ChannelUpdateDto,
  //   @Req() req: any,
  // ): Promise<Response> {
  //   if (req.error) {
  //     return {
  //       status: HttpStatus.FORBIDDEN,
  //       message: 'Access to this resource is denied',
  //     }
  //   } else {
  //     const data = await this.channelService.updateChannel(
  //       channelId,
  //       req.user.id,
  //       channelUpdate,
  //     )
  //     if (data) {
  //       return {
  //         status: HttpStatus.OK,
  //         message: 'Update channel success',
  //         data: data,
  //       }
  //     } else {
  //       return {
  //         status: HttpStatus.NOT_FOUND,
  //         message: 'Channel not found',
  //       }
  //     }
  //   }
  // }

  // @Delete(':channelId')
  // async deleteChannel(
  //   @Param('channelId') channelId: string,
  //   @Req() req: any,
  // ): Promise<Response> {
  //   if (req.error) {
  //     return {
  //       status: HttpStatus.FORBIDDEN,
  //       message: 'You are not authorized to delete this channel',
  //     }
  //   }

  //   const data = await this.channelService.deleteChannel(channelId, req.user.id)
  //   if (data) {
  //     return {
  //       status: HttpStatus.OK,
  //       message: 'Delete channel success',
  //     }
  //   } else {
  //     return {
  //       status: HttpStatus.BAD_REQUEST,
  //       message: 'Failed to delete channel',
  //     }
  //   }
  // }

  // @Put(':channelId/add-user')
  // async addUserToChannel(
  //   @Param('channelId') channelId: string,
  //   @Body('users') users: UserOfChannel[],
  //   @Req() req: any,
  // ): Promise<Response> {
  //   if (req.error) {
  //     return {
  //       status: HttpStatus.FORBIDDEN,
  //       message: 'You are not authorized to add user to this channel',
  //     }
  //   } else {
  //     const data = await this.channelService.addUserToChannel(
  //       channelId,
  //       users,
  //       req.user.id,
  //     )
  //     if (data) {
  //       return {
  //         status: HttpStatus.OK,
  //         message: 'Add user to channel success',
  //       }
  //     } else {
  //       return {
  //         status: HttpStatus.BAD_REQUEST,
  //         message: 'Add user to channel fail',
  //       }
  //     }
  //   }
  // }

  // @Delete(':channelId/remove-user')
  // async removeUserFromChannel(
  //   @Param('channelId') channelId: string,
  //   @Body('users') users: string[],
  //   @Req() req: any,
  // ): Promise<Response> {
  //   if (req.error) {
  //     return {
  //       status: HttpStatus.FORBIDDEN,
  //       message: 'You are not authorized to remove user from this channel',
  //     }
  //   }
  //   const data = await this.channelService.removeUserFromChannel(
  //     channelId,
  //     req.user.id,
  //     users,
  //   )
  //   if (data) {
  //     return {
  //       status: HttpStatus.OK,
  //       message: 'Remove user from channel success',
  //     }
  //   } else {
  //     return {
  //       status: HttpStatus.BAD_REQUEST,
  //       message: 'Remove user from channel fail',
  //     }
  //   }
  // }

  // @Put(':channelId/update-role')
  // async updateRoleUserInChannel(
  //   @Param('channelId') channelId: string,
  //   @Body() user: UserOfChannel,
  //   @Req() req: any,
  // ): Promise<Response> {
  //   if (req.error) {
  //     return {
  //       status: HttpStatus.FORBIDDEN,
  //       message: 'You are not authorized to update role of this user',
  //     }
  //   }
  //   const data = await this.channelService.updateRoleUserInChannel(
  //     channelId,
  //     user,
  //     req.user.id,
  //   )
  //   if (data) {
  //     return {
  //       status: HttpStatus.OK,
  //       message: 'Update role user in channel success',
  //     }
  //   } else {
  //     return {
  //       status: HttpStatus.BAD_REQUEST,
  //       message: 'Update role user in channel fail',
  //     }
  //   }
  // }

  // @Put(':channelId/leave')
  // async leaveChannel(
  //   @Param('channelId') channelId: string,
  //   @Req() req: any,
  //   @Body('transferOwner') transferOwner?: string,
  // ): Promise<Response> {
  //   if (req.error) {
  //     return {
  //       status: HttpStatus.FORBIDDEN,
  //       message: 'You are not authorized to leave this channel',
  //     }
  //   }
  //   const data = await this.channelService.leaveChannel(
  //     channelId,
  //     req.user.id,
  //     transferOwner,
  //   )
  //   if (data) {
  //     return {
  //       status: HttpStatus.OK,
  //       message: 'Leave channel success',
  //     }
  //   } else {
  //     return {
  //       status: HttpStatus.BAD_REQUEST,
  //       message: 'Leave channel fail',
  //     }
  //   }
  // }
}
