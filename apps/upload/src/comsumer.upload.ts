import { Queue } from '@app/common/enums';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { UploadService } from './upload.service';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private channelWrapper: ChannelWrapper;
  private readonly logger = new Logger(ConsumerService.name);

  constructor(private readonly uploadService: UploadService) {
    const connection = amqp.connect(['amqp://admin:admin@localhost']);
    this.channelWrapper = connection.createChannel();
  }

  public async onModuleInit() {
    try {
      await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        await channel.assertQueue(Queue.Upload, { durable: true });
        await channel.consume(Queue.Upload, async (message) => {
          if (message) {
            console.log(message);
            console.log(message.content.toString());
            const content = JSON.parse(message.content.toString());
            this.logger.log('Received message:', content);
            // await this.emailService.sendEmail(content);
            channel.ack(message);
          }
        });
      });
      this.logger.log('Consumer service started and listening for messages.');
    } catch (err) {
      this.logger.error('Error starting the consumer:', err);
    }
  }
}
