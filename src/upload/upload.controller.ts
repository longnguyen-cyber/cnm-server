/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import slugify from 'slugify';
import { FileCreateDto } from 'src/thread/dto/fileCreate.dto';
import { ResThreadDto } from 'src/thread/dto/resThread.dto';
//porker
@ApiTags('uploads')
@Controller('uploads')
export class UploadController {
  @Get(':filename')
  async serveFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    res.sendFile(filename, { root: './uploads' });
  }
  @Get(':filename')
  getFile(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const file = createReadStream(
      join(__dirname, '..', '..', 'uploads', filename),
    );
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(file);
  }
  //get All file
  @Get()
  async serveFiles(@Res() res: Response): Promise<void> {
    console.log('get all file');
    res.sendFile('uploads', { root: './' });
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, callback) => {
          const sanitizedFilename = slugify(file.originalname, {
            replacement: '',
            remove: null,
            lower: false,
            strict: false,
            locale: 'vi',
            trim: true,
            
          });
          callback(null, sanitizedFilename);
        },
      }),
    }),
  )
  async updateThread(@UploadedFile() file?: Express.Multer.File): Promise<any> {
    const fileUpload: FileCreateDto = { ...file };
    return {
      success: true,
      message: '',
      errors: '',
      data: fileUpload,
    };
  }
}
