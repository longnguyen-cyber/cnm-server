/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger'
import { Response } from 'src/common/common.type'
import { ChannelService } from './channel.service'
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto'
import { ChannelResquestCreateDto } from './dto/channelResquestCreate.dto'
import { ResChannelDto } from './dto/resChannel.dto'
import { AuthGuard } from '../auth/guard/auth.guard'

@ApiTags('channels')
@Controller('channels')
// @UseGuards(AuthGuard)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get()
  async getAllChannel(): Promise<Response> {
    return {
      status: HttpStatus.OK,
      message: 'Get all channel success',
      data: await this.channelService.getAllChannel(),
    }
  }
  @Get(':channelId')
  async getChannelById(
    @Param('channelId') channelId: string,
  ): Promise<Response> {
    return {
      status: HttpStatus.OK,
      message: 'Get channel success',
      data: await this.channelService.getChannelById(channelId),
    }
  }

  @Post()
  @ApiBody({ type: ChannelResquestCreateDto })
  @ApiCreatedResponse({ type: ResChannelDto })
  async createChannel(@Body() channel: any): Promise<Response> {
    const channelCreateDto = {
      name: channel.name,
      isPublic: channel.isPublic,
      userCreated: channel.userCreated.id,
    }
    const data = await this.channelService.createChannel(channelCreateDto)
    if (data) {
      return {
        status: HttpStatus.CREATED,
        message: 'Create channel success',
        data: data,
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Create channel fail',
        errors: 'Create channel fail',
      }
    }
  }

  @Put(':channelId')
  @ApiBody({ type: ChannelResquestCreateDto })
  @ApiCreatedResponse({ type: ResChannelDto })
  async updateChannel(
    @Param('channelId') channelId: string,
    @Body() channelUpdate: ChannelUpdateDto,
  ): Promise<Response> {
    const data = await this.channelService.updateChannel(
      channelId,
      channelUpdate,
    )
    if (data) {
      return {
        status: HttpStatus.OK,
        message: 'Update channel success',
        data: data,
      }
    } else {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Channel not found',
        errors: 'Channel not found',
      }
    }
  }

  @Delete(':channelId')
  @ApiCreatedResponse({ type: ResChannelDto })
  async deleteChannel(
    @Param('channelId') channelId: string,
  ): Promise<Response> {
    const data = await this.channelService.deleteChannel(channelId)
    if (data) {
      return {
        status: HttpStatus.OK,
        message: 'Delete channel success',
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Delete channel fail',
        errors: 'Delete channel fail',
      }
    }
  }

  @Put(':channelId/add-user')
  @ApiCreatedResponse({ type: ResChannelDto })
  async addUserToChannel(
    @Param('channelId') channelId: string,
    @Body('users') users: string[],
  ): Promise<Response> {
    const data = await this.channelService.addUserToChannel(channelId, users)
    if (data) {
      return {
        status: HttpStatus.OK,
        message: 'Add user to channel success',
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Add user to channel fail',
        errors: 'Add user to channel fail',
      }
    }
  }
}
