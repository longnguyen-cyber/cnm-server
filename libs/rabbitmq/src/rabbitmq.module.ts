import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { Queue } from '@app/common/enums';

@Module({
  providers: [
    {
      provide: 'RabbitMQUploadService',
      useFactory: () => {
        return new RabbitMQService(Queue.Upload);
      },
      // inject: [Queue.Upload],
    },
    {
      provide: 'RabbitMQMailService',
      useFactory: () => {
        return new RabbitMQService(Queue.Email);
      },
      // inject: [Queue.Email],
    },
  ],
  exports: ['RabbitMQUploadService', 'RabbitMQMailService'],
})
export class RabbitMQModule {}
