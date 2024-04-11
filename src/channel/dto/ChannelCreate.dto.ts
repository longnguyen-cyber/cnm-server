import { IsNotEmpty } from 'class-validator'

export class ChannelCreateDto {
  @IsNotEmpty()
  readonly name: string

  readonly userCreated: string

  readonly members: string[]
}
