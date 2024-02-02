import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ConsumerService } from '../consumers/upload.consumer'
import { UploadService } from './upload.service'

@Module({
  /* The commented out code block is configuring the ThrottlerModule for rate limiting in the
  UploadModule. */
  // imports: [
  //   ThrottlerModule.forRootAsync({
  //     useFactory: (configService: ConfigService) => ({
  //       ttl: configService.getOrThrow('UPLOAD_RATE_TTL'),
  //       limit: configService.getOrThrow('UPLOAD_RATE_LIMIT'),
  //     }),
  //     inject: [ConfigService],
  //   }),
  // ],
  providers: [UploadService, ConfigService, ConsumerService],
  exports: [UploadService],
})
export class UploadModule {}
