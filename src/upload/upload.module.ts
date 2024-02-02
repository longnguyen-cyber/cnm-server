import { Module } from '@nestjs/common'
import { UploadController } from './upload.controller'
import { UploadService } from './upload.service'
import { ConfigService } from '@nestjs/config'
import { ConsumerService } from '../consumers/upload.consumer'

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
  // imports: [RabbitMQModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    ConfigService,
    ConsumerService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
  exports: [UploadService],
})
export class UploadModule {}
