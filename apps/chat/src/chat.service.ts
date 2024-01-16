import { Chat, ChatCreateDto } from '@app/common';
import { Injectable } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { ChatToDBDto } from './dto/relateDB/ChatToDB.dto';

@Injectable()
export class ChatService {
  constructor(private chatRepository: ChatRepository) {}

  async getAllChat(): Promise<Chat[] | any> {
    return await this.chatRepository.getAllChat();
  }

  async getChatById(chatId: string) {
    const chat = await this.chatRepository.getChatById(chatId);

    return {
      ...chat,
      user: {
        ...chat.user,
        // avatar: this.commonService.transferFileToURL(req, chat.user.avatar),
      },
    };
  }

  async createChat(
    chatCreateDto: ChatCreateDto,
    senderId: string,
    receiveId: string,
  ): Promise<Chat | any> {
    const chatToDb = this.compareToCreateChat(
      chatCreateDto,
      senderId,
      receiveId,
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
