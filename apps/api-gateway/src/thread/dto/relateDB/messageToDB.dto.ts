import { MessageCreateDto } from "../messageCreate.dto"

export class MessageToDBDto extends MessageCreateDto {
  threadId: string
}
