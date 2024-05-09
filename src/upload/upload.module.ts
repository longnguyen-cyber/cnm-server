import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { UploadService } from './upload.service'
import { UploadController } from './upload.controller'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [ConfigModule, CommonModule],
  controllers: [UploadController],
  providers: [UploadService, ConfigService],
  exports: [UploadService],
})
export class UploadModule {}
