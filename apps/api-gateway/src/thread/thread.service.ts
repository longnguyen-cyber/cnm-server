import {
  THREAD_SERVICE_NAME,
  ThreadCondition,
  ThreadServiceClient,
  ThreadToDBDto,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ThreadCreateDto } from './dto/threadCreate.dto';

@Injectable()
export class ThreadService implements OnModuleInit {
  private threadService: ThreadServiceClient;
  constructor(
    @Inject(THREAD_SERVICE_NAME) private readonly client: ClientGrpc,
  ) {}
  onModuleInit() {
    this.client.getService<ThreadServiceClient>(THREAD_SERVICE_NAME);
  }

  async createThread(thread: ThreadToDBDto): Promise<any> {
    return this.threadService.createThread(thread);
  }

  async createReplyThread(thread: ThreadCondition): Promise<any> {
    return this.threadService.createReplyThread(thread);
  }

  async updateThread(thread: ThreadToDBDto): Promise<any> {
    return this.threadService.updateThread(thread);
  }

  async addReact(thread: ThreadCondition): Promise<any> {
    return this.threadService.addReact(thread);
  }

  async removeReact(thread: ThreadCondition): Promise<any> {
    return this.threadService.removeReact(thread);
  }

  async deleteThread(thread: ThreadCondition): Promise<any> {
    return this.threadService.deleteThread(thread);
  }

  async findByText(thread: ThreadCondition): Promise<any> {
    return this.threadService.recallSendThread(thread);
  }

  async findByDate(thread: ThreadCondition): Promise<any> {
    return this.threadService.findByDate(thread);
  }

  async getThreadById(thread: ThreadCondition): Promise<any> {
    return this.threadService.getThreadById(thread);
  }

  async getThreadByReceiveId(thread: ThreadCondition): Promise<any> {
    return this.threadService.getThreadByReceiveId(thread);
  }

  async getAllThreads(thread: ThreadCondition): Promise<any> {
    return this.threadService.getAllThreads(thread);
  }
}
