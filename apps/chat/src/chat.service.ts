import { Chat, ChatCreateDto } from '@app/common';
import { Injectable } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { ChatToDBDto } from './dto/relateDB/ChatToDB.dto';

@Injectable()
export class ChatService {
  constructor(private chatRepository: ChatRepository) {}

  async getAllChat(): Promise<any> {
    const data = await this.chatRepository.getAllChat();
    return data;
  }

  async createChat(chatCreateDto: ChatCreateDto): Promise<Chat | any> {
    const chatToDb = this.compareToCreateChat(
      chatCreateDto,
      chatCreateDto.senderId,
      chatCreateDto.receiveId,
    );

    const chat = await this.chatRepository.createChat(chatToDb);
    return chat;
  }

  private compareToCreateChat(
    chatCreateDto: ChatCreateDto,
    senderId: string,
    receiveId: string,
  ): ChatToDBDto {
    return {
      ...chatCreateDto,
      senderId,
      receiveId,
    };
  }
}
