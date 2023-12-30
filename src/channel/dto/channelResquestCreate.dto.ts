import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { ChannelCreateDto } from './ChannelCreate.dto';
import { ChannelUpdateDto } from './ChannelUpdate.dto';

export class ChannelResquestCreateDto {
  @ApiProperty({ type: ChannelCreateDto })
  @ValidateNested()
  channel?: ChannelCreateDto;
  @ApiProperty({ type: ChannelUpdateDto })
  @ValidateNested()
  channelUpdate?: ChannelUpdateDto;
}
