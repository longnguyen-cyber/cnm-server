import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class UserOfChannel {
  @ApiProperty({
    example: 'kick-off',
    description: 'the name of the channel',
  })
  @IsNotEmpty()
  readonly id: string

  @ApiProperty({
    example: 'status',
    description: 'the status of the channel',
  })
  readonly role: string
}
