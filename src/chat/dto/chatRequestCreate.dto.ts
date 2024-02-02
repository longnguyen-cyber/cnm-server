import { ApiProperty } from '@nestjs/swagger';
import { ChatCreateDto } from './ChatCreate.dto';
import { ValidateNested } from 'class-validator';

export class ChatRequestCreateDto {
  @ApiProperty({ type: ChatCreateDto })
  @ValidateNested()
  chat: ChatCreateDto;

  @ApiProperty({ type: String })
  senderId: string;

  @ApiProperty({ type: String })
  receiveId: string;
}
