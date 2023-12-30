import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ChannelCreateDto {
  @ApiProperty({
    example: 'channelName',
    description: 'the name of the channel',
  })
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({
    example: 'status',
    description: 'the status of the channel',
  })
  readonly isPublic: boolean;

  @ApiProperty({
    example: '2sf2323423',
    description: 'the id of the user who created the channel',
  })
  readonly userCreated: string;
}
