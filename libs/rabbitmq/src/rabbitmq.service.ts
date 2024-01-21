import { Queue, UploadMethod } from '@app/common/enums';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { Channel } from 'amqplib';

@Injectable()
export class RabbitMQService {
  private channelWrapper: ChannelWrapper;
  constructor(private queue: Queue) {
    const connection = amqp.connect(['amqp://admin:admin@localhost']);
    this.channelWrapper = connection.createChannel({
      setup: (channel: Channel) => {
        return channel.assertQueue(this.queue, { durable: true });
      },
    });
  }

  async addToQueue(queue: Queue, message: any) {
    try {
      await this.channelWrapper.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
        },
      );
      Logger.log('Sent To Queue');
    } catch (error) {
      throw new HttpException(
        'Error adding mail to queue',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
