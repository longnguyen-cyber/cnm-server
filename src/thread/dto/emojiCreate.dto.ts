import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class EmojiCreateDto {
  @ApiProperty({
    example: '3sdf3',
    description: 'the emoji of the thread',
  })
  @IsNotEmpty()
  @IsString()
  readonly emoji: string

  @ApiProperty({
    example: '3',
    description: 'quantity',
  })
  @IsNotEmpty()
  @IsNumber()
  readonly quantity: number
}
