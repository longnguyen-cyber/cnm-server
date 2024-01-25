/* eslint-disable prettier/prettier */
import { ChannelUpdateDto } from '@app/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChannelService } from './channel.service';

@ApiTags('channels')
@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get()
  async getAllChannel() {
    return await this.channelService.getAllChannel();
  }
  @Get(':channelId')
  async getChannelById(@Param('channelId') channelId: string) {
    return await this.channelService.getChannelById({ id: channelId });
  }

  @Post()
  async createChannel(@Body() channel: any) {
    const channelCreateDto = {
      name: channel.name,
      isPublic: channel.isPublic,
      userCreated: channel.userCreated.id,
    };
    return await this.channelService.createChannel(channelCreateDto);
  }

  @Put()
  async updateChannel(@Body() channelUpdate: ChannelUpdateDto) {
    return await this.channelService.updateChannel(channelUpdate);
  }

  @Delete(':channelId')
  async deleteChannel(@Param('channelId') channelId: string) {
    return await this.channelService.deleteChannel({ id: channelId });
  }

  @Put(':channelId/add-user')
  async addUserToChannel(
    @Param('channelId') channelId: string,
    @Body('users') users: string[],
  ) {
    return await this.channelService.addUserToChannel({ channelId, users });
  }
}
