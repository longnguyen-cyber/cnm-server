import { MessageCreateDto } from '../messageCreate.dto'
import { ThreadCreateDto } from '../threadCreate.dto'
import { FileToDB } from './fileToDB.dto'

export class ThreadToDBDto extends ThreadCreateDto {
  senderId: string
  chatId: string
  channelId: string
  cloudId: string
  threadId?: string
  replyId?: string
  messages: MessageCreateDto
  file: FileToDB[]
  stoneId: string
  pin?: boolean
  mentions?: string[]
}
