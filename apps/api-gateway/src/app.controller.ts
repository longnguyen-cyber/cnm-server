import { Queue } from '@app/common/enums';
import { RabbitMQService } from '@app/rabbitmq';
import { Controller, Get, Inject } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(
    @Inject('RabbitMQUploadService')
    private readonly rabbitMQService: RabbitMQService,
  ) {}
  @Get('heath-check')
  getHello(): string {
    return 'I am alive!';
  }

  @Get('test')
  async test() {
    await this.rabbitMQService.addToQueue(Queue.Upload, {
      message: 'test',
    });
  }
}
