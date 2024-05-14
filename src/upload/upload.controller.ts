/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  HttpStatus,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { Response } from 'src/common/common.type'
import { UploadService } from './upload.service'
import { CommonService } from '../common/common.service'

@ApiTags('upload')
@Controller('upload')
// @UseGuards(AuthGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly conmmonService: CommonService
  ) {}
  @Get()
  async getFileUpload(): Promise<Response> {
    return {
      status: HttpStatus.OK,
      message: 'Get file upload success',
      data: await this.uploadService.getFileByKeyFileName('wallpaper.jpg'),
    }
  }
  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async sd(@UploadedFiles() files?: Express.Multer.File[]): Promise<any> {
    const isLimit = files.every((file) =>
      this.conmmonService.limitFileSize(file.size)
    )

    if (!isLimit) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'File size is too large',
      }
    }
    const rs = await Promise.all(
      files.map(async (file) => {
        return {
          path: await this.uploadService.upload(file.originalname, file.buffer),
          filename: file.originalname,
          size: file.size,
        }
      })
    )

    console.log('upload success', rs)

    return {
      status: HttpStatus.OK,
      message: 'Upload success',
      data: rs,
    }
  }
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File
  ): Promise<any> {
    if (!this.conmmonService.limitFileSize(file.size)) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'File size is too large',
      }
    }
    const upload = await this.uploadService.upload(
      file.originalname,
      file.buffer
    )
    const data = {
      path: upload,
      filename: file.originalname,
      size: file.size,
    }
    console.log('upload success', data)
    return {
      status: HttpStatus.OK,
      message: 'Upload success',
      data,
    }
  }
}
