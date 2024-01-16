/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Empty } from './empty';

// export const protobufPackage = 'chat';

export interface ChatCreateDto {
  senderId: string;
  receiveId: string;
  chatId?: string | undefined;
}

export interface Chat {
  senderId: string;
  receiveId: string;
  chatId?: string | undefined;
}

export interface Chats {
  chats: Chat[];
}

export interface FindOneChatDto {
  chatId: string;
}

export const CHAT_PACKAGE_NAME = 'chat';

export interface ChatServiceClient {
  createChat(request: ChatCreateDto): Observable<Chat>;

  getAllChats(request: Empty): Observable<Chats>;

  getChatById(request: FindOneChatDto): Observable<Chat>;
}

export interface ChatServiceController {
  createChat(request: ChatCreateDto): Promise<Chat> | Observable<Chat> | Chat;

  getAllChats(request: Empty): Promise<Chats> | Observable<Chats> | Chats;

  getChatById(request: FindOneChatDto): Promise<Chat> | Observable<Chat> | Chat;
}

export function ChatServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['createChat', 'getAllChats', 'getChatById'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('ChatService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcStreamMethod('ChatService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const CHAT_SERVICE_NAME = 'ChatService';
