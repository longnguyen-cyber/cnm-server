import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MessageCreateDto {
  @ApiProperty({
    example: 'message',
    description: 'the message of the thread',
  })
  @IsNotEmpty()
  @IsString()
  readonly message: string;
}
