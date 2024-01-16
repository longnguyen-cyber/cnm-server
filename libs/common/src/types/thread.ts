/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

// export const protobufPackage = "thread";

export interface Threads {
  threads: Thread[];
}

export interface ThreadCondition {
  threadId?: string | undefined;
  senderId?: string | undefined;
  reactString?: string | undefined;
  quantity?: number | undefined;
  messages?: MessageToDBDto | undefined;
  file?: FileCreateDto | undefined;
  react?: ReactCreateDto | undefined;
  text?: TextSearch | undefined;
  date?: DateSearch | undefined;
  channelId?: string | undefined;
  chatId?: string | undefined;
  receiveId?: string | undefined;
  type?: string | undefined;
}

export interface TextSearch {
  text: string;
}

export interface DateSearch {
  from: string;
  to?: string | undefined;
}

export interface ThreadToDBDto {
  receiveId?: string | undefined;
  senderId: string;
  chatId: string;
  channelId?: string | undefined;
  threadId?: string | undefined;
  messages?: MessageToDBDto | undefined;
  file?: FileCreateDto | undefined;
  react?: ReactCreateDto | undefined;
}

export interface MessageToDBDto {
  message: string;
}

export interface FileCreateDto {
  fileName: string;
  originalName: string;
  encoding: string;
  minetype: string;
  description: string;
  path: string;
  size: string;
}

export interface ReactCreateDto {
  react: string;
  quantity: number;
}

export interface Thread {
  receiveId?: string | undefined;
  senderId?: string | undefined;
  chatId?: string | undefined;
  threadId?: string | undefined;
  messages?: MessageToDBDto | undefined;
  file?: FileCreateDto | undefined;
  react?: ReactCreateDto | undefined;
}

export const THREAD_PACKAGE_NAME = 'thread';

export interface ThreadServiceClient {
  createThread(request: ThreadToDBDto): Observable<Thread>;

  updateThread(request: ThreadToDBDto): Observable<Thread>;

  deleteThread(request: ThreadCondition): Observable<Thread>;

  recallSendThread(request: ThreadCondition): Observable<Thread>;

  createReplyThread(request: ThreadCondition): Observable<Thread>;

  addReact(request: ThreadCondition): Observable<Thread>;

  removeReact(request: ThreadCondition): Observable<Thread>;

  getAllThreads(request: ThreadCondition): Observable<Threads>;

  getThreadById(request: ThreadCondition): Observable<Thread>;

  getThreadByReceiveId(request: ThreadCondition): Observable<Thread>;

  findByText(request: ThreadCondition): Observable<Threads>;

  findByDate(request: ThreadCondition): Observable<Threads>;
}

export interface ThreadServiceController {
  createThread(
    request: ThreadToDBDto,
  ): Promise<Thread> | Observable<Thread> | Thread;

  updateThread(
    request: ThreadToDBDto,
  ): Promise<Thread> | Observable<Thread> | Thread;

  deleteThread(
    request: ThreadCondition,
  ): Promise<Thread> | Observable<Thread> | Thread;

  recallSendThread(
    request: ThreadCondition,
  ): Promise<Thread> | Observable<Thread> | Thread;

  createReplyThread(
    request: ThreadCondition,
  ): Promise<Thread> | Observable<Thread> | Thread;

  addReact(
    request: ThreadCondition,
  ): Promise<Thread> | Observable<Thread> | Thread;

  removeReact(
    request: ThreadCondition,
  ): Promise<Thread> | Observable<Thread> | Thread;

  getAllThreads(
    request: ThreadCondition,
  ): Promise<Threads> | Observable<Threads> | Threads;

  getThreadById(
    request: ThreadCondition,
  ): Promise<Thread> | Observable<Thread> | Thread;

  getThreadByReceiveId(
    request: ThreadCondition,
  ): Promise<Thread> | Observable<Thread> | Thread;

  findByText(
    request: ThreadCondition,
  ): Promise<Threads> | Observable<Threads> | Threads;

  findByDate(
    request: ThreadCondition,
  ): Promise<Threads> | Observable<Threads> | Threads;
}

export function ThreadServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'createThread',
      'updateThread',
      'deleteThread',
      'recallSendThread',
      'createReplyThread',
      'addReact',
      'removeReact',
      'getAllThreads',
      'getThreadById',
      'getThreadByReceiveId',
      'findByText',
      'findByDate',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('ThreadService', method)(
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
      GrpcStreamMethod('ThreadService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const THREAD_SERVICE_NAME = 'ThreadService';
