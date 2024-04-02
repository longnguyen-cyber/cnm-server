/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { Response } from 'src/common/common.type'
import { UploadService } from './upload.service'

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
  @Post()
  @UseInterceptors(FileInterceptor('send'))
  async sd(@UploadedFile() file?: Express.Multer.File): Promise<any> {
    console.log(file)
  }
}
