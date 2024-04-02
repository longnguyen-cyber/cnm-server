import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ConsumerService } from '../consumers/upload.consumer'
import { UploadService } from './upload.service'
import { UploadController } from './upload.controller'

@Module({
  controllers: [UploadController],
  providers: [UploadService, ConfigService, ConsumerService],
  exports: [UploadService],
})
export class UploadModule {}
