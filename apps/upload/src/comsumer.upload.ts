import { Queue, UploadMethod } from '@app/common/enums';
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
          const messageData = JSON.parse(message.content.toString());
          const cmd = messageData.cmd;
          const payload = messageData.payload;
          console.log(cmd, payload);

          switch (cmd) {
            case UploadMethod.UploadSingle:
              await this.uploadService.upload(payload.fileName, payload.file);
              break;
            case UploadMethod.UploadMultiple:
              await this.uploadService.uploadMultiple(payload);
              break;
            case UploadMethod.Update:
              await this.uploadService.update(
                payload.fileName,
                payload.file,
                payload.oldFileName,
              );
              break;
            case UploadMethod.Delete:
              await this.uploadService.delete(payload.fileName);
              break;
            case UploadMethod.DeleteMultiple:
              await this.uploadService.deleteMultiple(payload);
              break;
            default:
              this.logger.error('Unknown command:', cmd);
              break;
          }
          channel.ack(message);

          // switch (message?.content.toString()) {
          //   case :
          // }
          // if (message) {
          //   // console.log(message);
          //   console.log(message.content.toString());
          //   const content = JSON.parse(message.content.toString());
          //   this.logger.log('Received message:', content);
          //   // await this.emailService.sendEmail(content);
          //   channel.ack(message);
          // }
        });
      });
      this.logger.log('Consumer service started and listening for messages.');
    } catch (err) {
      this.logger.error(err);
    }
  }
}
