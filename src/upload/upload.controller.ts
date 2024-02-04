/* eslint-disable prettier/prettier */
import { Controller, Get, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UploadService } from './upload.service'
import { Response } from 'src/common/common.type'

@ApiTags('upload')
@Controller('upload')
// @UseGuards(AuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  @Get()
  async getFileUpload(): Promise<Response> {
    return {
      status: HttpStatus.OK,
      message: 'Get file upload success',
      data: await this.uploadService.getFileByKeyFileName('wallpaper.jpg'),
    }
  }
}
