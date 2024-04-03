import { EmojiCreateDto } from '../emojiCreate.dto'

export class EmojiToDBDto extends EmojiCreateDto {
  stoneId: string
  senderId: string
}
