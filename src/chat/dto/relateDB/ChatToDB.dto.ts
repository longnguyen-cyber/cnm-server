import { ChatCreateDto } from '../ChatCreate.dto';

export class ChatToDBDto extends ChatCreateDto {
  senderId: string;
  receiveId: string;
  chatId?: string;
}
