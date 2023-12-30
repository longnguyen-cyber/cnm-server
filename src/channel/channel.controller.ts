/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ChannelService } from './channel.service';
import { ChannelUpdateDto } from './dto/ChannelUpdate.dto';
import { ChannelResquestCreateDto } from './dto/channelResquestCreate.dto';
import { ResChannelDto } from './dto/resChannel.dto';
import { Request } from 'express';

@ApiTags('channels')
@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get()
  async getAllChannel(@Req() req: Request) {
    return await this.channelService.getAllChannel(req);
  }
  @Get(':channelId')
  async getChannelById(@Param('channelId') channelId: string) {
    return await this.channelService.getChannelById(channelId);
  }

  @Post()
  @ApiBody({ type: ChannelResquestCreateDto })
  @ApiCreatedResponse({ type: ResChannelDto })
  async createChannel(@Body() channel: any) {
    const channelCreateDto = {
      name: channel.name,
      isPublic: channel.isPublic,
      userCreated: channel.userCreated.id,
    };
    return await this.channelService.createChannel(channelCreateDto);
  }

  @Put(':channelId')
  @ApiBody({ type: ChannelResquestCreateDto })
  @ApiCreatedResponse({ type: ResChannelDto })
  async updateChannel(
    @Param('channelId') channelId: string,
    @Body('channelUpdate') channelUpdate: ChannelUpdateDto,
  ) {
    return await this.channelService.updateChannel(channelId, channelUpdate);
  }

  @Delete(':channelId')
  @ApiCreatedResponse({ type: ResChannelDto })
  async deleteChannel(@Param('channelId') channelId: string) {
    return await this.channelService.deleteChannel(channelId);
  }

  @Put(':channelId/add-user')
  @ApiCreatedResponse({ type: ResChannelDto })
  async addUserToChannel(
    @Param('channelId') channelId: string,
    @Body('users') users: string[],
  ) {
    return await this.channelService.addUserToChannel(channelId, users);
  }
}
