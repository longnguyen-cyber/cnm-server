import { MessageCreateDto } from '../../../thread/dto/messageCreate.dto'
import { FileToDB } from '../../../thread/dto/relateDB/fileToDB.dto'

export class ChatToDBDto {
  senderId: string
  receiveId: string
  chatId?: string
  messages?: MessageCreateDto
  file?: FileToDB[]
}
