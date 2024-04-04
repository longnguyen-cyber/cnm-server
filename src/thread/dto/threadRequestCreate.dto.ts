import { ValidateNested } from 'class-validator'
import { MessageCreateDto } from './messageCreate.dto'
import { ThreadCreateDto } from './threadCreate.dto'

export class ThreadRequestCreateDto {
  @ValidateNested()
  thread: ThreadCreateDto

  @ValidateNested()
  message: MessageCreateDto
}
