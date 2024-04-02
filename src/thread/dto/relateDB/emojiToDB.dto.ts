import { EmojiCreateDto } from '../emojiCreate.dto'

export class EmojiToDBDto extends EmojiCreateDto {
  threadId: string
  senderId: string
}
