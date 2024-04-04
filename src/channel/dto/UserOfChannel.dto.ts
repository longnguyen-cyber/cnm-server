import { IsNotEmpty } from 'class-validator'

export class UserOfChannel {
  @IsNotEmpty()
  readonly id: string

  readonly role: string
}
