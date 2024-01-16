import { Controller, Get } from '@nestjs/common';
import { ThreadService } from './thread.service';
import {
  Thread,
  ThreadCondition,
  ThreadServiceController,
  ThreadServiceControllerMethods,
  ThreadToDBDto,
  Threads,
} from '@app/common';
import { Observable } from 'rxjs';

@Controller()
@ThreadServiceControllerMethods()
export class ThreadController implements ThreadServiceController {
  constructor(private readonly threadService: ThreadService) {}
  createThread(
    request: ThreadToDBDto,
  ): Thread | Observable<Thread> | Promise<Thread> {
    return this.threadService.createThread(request);
  }
  updateThread(
    request: ThreadToDBDto,
  ): Thread | Observable<Thread> | Promise<Thread> {
    return this.threadService.updateThread(request);
  }
  deleteThread(
    request: ThreadCondition,
  ): Thread | Observable<Thread> | Promise<Thread> {
    return this.threadService.deleteThread(request.threadId);
  }
  recallSendThread(
    request: ThreadCondition,
  ): Thread | Observable<Thread> | Promise<Thread> {
    return this.threadService.recallSendThread(
      request.threadId,
      request.senderId,
    );
  }
  createReplyThread(
    request: ThreadCondition,
  ): Thread | Observable<Thread> | Promise<Thread> {
    return this.threadService.createReplyThread(request);
  }
  addReact(
    request: ThreadCondition,
  ): Thread | Observable<Thread> | Promise<Thread> {
    return this.threadService.addReact(
      request.react.react,
      request.react.quantity,
      request.threadId,
      request.senderId,
    );
  }
  removeReact(
    request: ThreadCondition,
  ): Thread | Observable<Thread> | Promise<Thread> {
    return this.threadService.removeReact(request.threadId, request.senderId);
  }
  getAllThreads(
    request: ThreadCondition,
  ): Threads | Observable<Threads> | Promise<Threads> {
    return this.threadService.getAllThread(request.type, request.chatId);
  }
  getThreadById(
    request: ThreadCondition,
  ): Thread | Observable<Thread> | Promise<Thread> {
    return this.threadService.getThreadById(request.threadId);
  }
  getThreadByReceiveId(
    request: ThreadCondition,
  ): Thread | Observable<Thread> | Promise<Thread> {
    return this.threadService.getThreadByReceiveId(request.receiveId);
  }
  findByText(
    request: ThreadCondition,
  ): Threads | Observable<Threads> | Promise<Threads> {
    return this.threadService.findByText(request.text.text);
  }
  findByDate(
    request: ThreadCondition,
  ): Threads | Observable<Threads> | Promise<Threads> {
    return this.threadService.findByDate(request.date.from, request.date.to);
  }
}
