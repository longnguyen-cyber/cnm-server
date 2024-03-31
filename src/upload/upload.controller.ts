/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UploadService } from './upload.service'
import { Response } from 'src/common/common.type'
import { FileInterceptor } from '@nestjs/platform-express'
import { unlink } from 'fs'
import { diskStorage } from 'multer'
import slugify from 'slugify'
import { FileCreateDto } from 'src/thread/dto/fileCreate.dto'
import { MessageCreateDto } from 'src/thread/dto/messageCreate.dto'
import { ResThreadDto } from 'src/thread/dto/resThread.dto'

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
