import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import amqp, { ChannelWrapper } from 'amqp-connection-manager'
import { ConfirmChannel } from 'amqplib'
import { Queue, UploadMethod } from '../enums'
import { UploadService } from '../upload/upload.service'

@Injectable()
export class ConsumerService implements OnModuleInit {
  private channelWrapper: ChannelWrapper
  private readonly logger = new Logger(ConsumerService.name)

  constructor(private readonly uploadService: UploadService) {
    const connection = amqp.connect(['amqp://admin:admin@localhost'])
    this.channelWrapper = connection.createChannel()
  }

  public async onModuleInit() {
    try {
      await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        await channel.assertQueue(Queue.Upload, { durable: true })
        await channel.consume(Queue.Upload, async (message) => {
          const messageData = JSON.parse(message.content.toString())
          const cmd = messageData.cmd
          const payload = messageData.payload
          if (cmd != undefined && payload != undefined) {
            //validate file if have space change to -

            if (payload.fileName.includes(' ')) {
              const newFileName = payload.fileName.replaceAll(' ', '-')
              payload.fileName = newFileName
            }
            const {
              fileName,
              file: { data },
            } = payload

            const dataUpload = Buffer.from(data)
            switch (cmd) {
              case UploadMethod.UploadSingle:
                await this.uploadService.upload(fileName, dataUpload)
                break

              case UploadMethod.Update:
                await this.uploadService.update(
                  fileName,
                  dataUpload,
                  payload.oldFileName,
                )
                break
              case UploadMethod.UpdateMultiple:
                await this.uploadService.updateMultiple(payload)
                break
              case UploadMethod.Delete:
                await this.uploadService.delete(fileName)
                break
              case UploadMethod.DeleteMultiple:
                await this.uploadService.deleteMultiple(payload)
                break
              case UploadMethod.GetFileByKeyFileName:
                await this.uploadService.getFileByKeyFileName(fileName)
                break
              default:
                this.logger.error('Unknown command')
                break
            }
          }

          channel.ack(message)
        })
      })
      this.logger.log('Consumer service started and listening for messages.')
    } catch (err) {
      this.logger.error(err)
    }
  }
}
