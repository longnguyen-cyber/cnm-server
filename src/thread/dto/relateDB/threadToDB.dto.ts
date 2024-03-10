import { FileCreateDto } from '../fileCreate.dto'
import { MessageCreateDto } from '../messageCreate.dto'
import { ReactCreateDto } from '../reactCreate.dto'
import { ThreadCreateDto } from '../threadCreate.dto'
import { FileToDB } from './fileToDB.dto'

export class ThreadToDBDto extends ThreadCreateDto {
  senderId: string
  chatId: string
  channelId: string
  threadId?: string
  replyId?: string
  messages: MessageCreateDto
  file: FileToDB[]
}
