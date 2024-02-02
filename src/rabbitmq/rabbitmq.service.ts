import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import amqp, { ChannelWrapper } from 'amqp-connection-manager'
import { Channel } from 'amqplib'
import { Queue, UploadMethod } from '../enums'

@Injectable()
export class RabbitMQService {
  private channelWrapper: ChannelWrapper
  constructor(private queue: Queue) {
    const connection = amqp.connect(['amqp://admin:admin@localhost'])
    this.channelWrapper = connection.createChannel({
      setup: (channel: Channel) => {
        return channel.assertQueue(this.queue, { durable: true })
      },
    })
  }

  async addToQueue(queue: Queue, message: UploadMethod | string, payload: any) {
    try {
      const data = {
        cmd: message,
        payload,
      }
      const rs = await this.channelWrapper.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(data)),
        {
          persistent: true,
        },
      )
      Logger.log('Sent To Queue')
      return rs
    } catch (error) {
      throw new HttpException(
        'Error adding mail to queue',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
