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
  @UseInterceptors(AnyFilesInterceptor())
  async sd(@UploadedFiles() files?: Express.Multer.File[]): Promise<any> {
    const rs = await Promise.all(
      files.map(async (file) => {
        return {
          path: await this.uploadService.upload(file.originalname, file.buffer),
          fileName: file.originalname,
        }
      }),
    )

    console.log('upload success', rs)

    return {
      status: HttpStatus.OK,
      message: 'Upload success',
      data: rs,
    }
  }
}
