import {
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    // private readonly rabbitMQService: RabbitMQService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    await this.uploadService.upload(file.originalname, file.buffer);
  }

  @Post('multiple')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadMultipleFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    await Promise.all(
      files.map((file) =>
        this.uploadService.upload(file.originalname, file.buffer),
      ),
    );
  }

  @Delete()
  @UseInterceptors(FileInterceptor('file'))
  async deleteFile(@UploadedFile() file: Express.Multer.File) {
    await this.uploadService.delete(file.originalname);
  }

  @Delete('multiple')
  @UseInterceptors(AnyFilesInterceptor())
  async deleteMultipleFiles(
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    await this.uploadService.deleteMultiple(
      files.map((file) => file.originalname),
    );
  }

  @Put(':oldFileName')
  @UseInterceptors(FileInterceptor('file'))
  async updateFile(
    @UploadedFile()
    file: Express.Multer.File,
    @Param('oldFileName') oldFileName: string,
  ) {
    await this.uploadService.update(
      file.originalname,
      file.buffer,
      oldFileName,
    );
  }
}
