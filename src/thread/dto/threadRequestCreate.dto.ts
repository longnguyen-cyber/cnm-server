import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { MessageCreateDto } from './messageCreate.dto';
import { ThreadCreateDto } from './threadCreate.dto';

export class ThreadRequestCreateDto {
  @ApiProperty({ type: ThreadCreateDto })
  @ValidateNested()
  thread: ThreadCreateDto;

  @ApiProperty({ type: MessageCreateDto })
  @ValidateNested()
  message: MessageCreateDto;
}
