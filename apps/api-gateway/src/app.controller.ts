import { RabbitMQService } from '@app/rabbitmq';
import { Controller, Get, Inject } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(
    @Inject('RabbitMQUploadService')
    private readonly rabbitMQService: RabbitMQService,
  ) {}
  @Get('heath-check')
  async getHello(): Promise<any> {
    return 'I am alive!';
  }
}
