import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class EmojiCreateDto {
  @IsNotEmpty()
  @IsString()
  readonly emoji: string

  @IsNotEmpty()
  @IsNumber()
  readonly quantity: number
}
