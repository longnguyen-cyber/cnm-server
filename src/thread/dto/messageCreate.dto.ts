import { IsNotEmpty, IsString } from 'class-validator'

export class MessageCreateDto {
  @IsNotEmpty()
  @IsString()
  readonly message: string
}
