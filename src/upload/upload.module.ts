import { Module } from "@nestjs/common"
import { UploadController } from "./upload.controller"
//porker

@Module({
  controllers: [UploadController]
})
export class UploadModule {}
