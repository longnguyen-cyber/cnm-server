import { IsNotEmpty } from 'class-validator'

export class ChannelCreateDto {
  @IsNotEmpty()
  readonly name: string

  readonly isPublic: boolean

  readonly userCreated: string

  readonly members: string[]
}
