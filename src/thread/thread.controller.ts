import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UsePipes,
} from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { unlink } from 'fs'
import { CustomValidationPipe } from '../common/common.pipe'
import { Response } from '../common/common.type'
import { FileCreateDto } from './dto/fileCreate.dto'
import { MessageCreateDto } from './dto/messageCreate.dto'
import { ReactCreateDto } from './dto/reactCreate.dto'
import { ResThreadDto } from './dto/resThread.dto'
import { ThreadRequestCreateDto } from './dto/threadRequestCreate.dto'
import { ThreadService } from './thread.service'

@ApiTags('threads')
@Controller('threads')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Post()
  @ApiBody({ type: ThreadRequestCreateDto })
  @ApiCreatedResponse({ type: ResThreadDto })
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './uploads',
  //       filename: (req, file, callback) => {
  //         const sanitizedFilename = slugify(file.originalname, {
  //           replacement: '-', // replace spaces with replacement character, defaults to `-`
  //           remove: undefined, // remove characters that match regex, defaults to `undefined`
  //           lower: false, // convert to lower case, defaults to `false`
  //           strict: false, // strip special characters except replacement, defaults to `false`
  //           locale: 'vi', // language code of the locale to use
  //           trim: true,
  //         })
  //         callback(null, sanitizedFilename)
  //       },
  //     }),
  //   }),
  // )
  async createThread(
    @Body('messages') messageCreateDto?: MessageCreateDto,
    @Body('react') reactCreateDto?: ReactCreateDto,
    @Body('senderId') senderId?: string,
    @Body('receiveId') receiveId?: string,
    @Body('channelId') channelId?: string,
    @Body('chatId') chatId?: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResThreadDto> {
    let fileUpload: FileCreateDto
    if (file) {
      fileUpload = {
        ...file,
        path: file.path.replace(/\\/g, '/'),
      }
    }

    const rs = await this.threadService.createThread(
      messageCreateDto,
      fileUpload,
      reactCreateDto,
      senderId,
      receiveId,
      channelId,
      chatId,
    )
    if (!rs) {
      if (file && file.path) {
        unlink(file.path, (err) => {
          if (err) {
            throw new Error(`Error deleting file: ${file.path}`)
          }
        })
      }
    }
    return {
      success: true,
      message: 'Create thread success',
      errors: '',
      data: null,
    }
  }
  @Post('reply')
  @ApiBody({ type: ThreadRequestCreateDto })
  @ApiCreatedResponse({ type: ResThreadDto })
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './uploads',
  //       filename: (_, file, callback) => {
  //         const sanitizedFilename = slugify(file.originalname, {
  //           lower: true, // convert to lower case, defaults to `false`
  //           strict: true, // strip special characters except replacement, defaults to `false`
  //         })
  //         callback(null, sanitizedFilename)
  //       },
  //     }),
  //   }),
  // )
  async createReplyThread(
    @Body('threadId') threadId: string,
    @Body('message') messageCreateDto?: MessageCreateDto,
    @Body('senderId') senderId?: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResThreadDto> {
    let fileUpload: FileCreateDto
    if (file) {
      fileUpload = {
        ...file,
        path: file.path.replace(/\\/g, '/'),
      }
    }

    const rs = await this.threadService.createReplyThread(
      threadId,
      senderId,
      messageCreateDto,
      fileUpload,
    )
    if (!rs.success) {
      if (file && file.path) {
        unlink(file.path, (err) => {
          if (err) {
            throw new Error(`Error deleting file: ${file.path}`)
          } else {
          }
        })
      }
    }

    return {
      success: true,
      message: 'Create thread success',
      errors: '',
      data: null,
    }
  }

  @Post('react')
  @ApiBody({ type: ThreadRequestCreateDto })
  @ApiCreatedResponse({ type: ResThreadDto })
  @UsePipes(new CustomValidationPipe())
  async addReact(
    @Body('react') reactToDb: string,
    @Body('quantity') quantity: number,
    @Body('threadId') threadId: string,
    @Body('senderId') senderId: string,
  ): Promise<ResThreadDto> {
    const rs = await this.threadService.addReact(
      reactToDb,
      quantity,
      threadId,
      senderId,
    )
    return {
      success: rs.thread.success,
      message: rs.thread.message,
      errors: rs.thread.errors,
      data: null,
    }
  }

  @Post('unreact')
  @ApiBody({ type: ThreadRequestCreateDto })
  @ApiCreatedResponse({ type: ResThreadDto })
  @UsePipes(new CustomValidationPipe())
  async removeReact(
    @Body('threadId') threadId: string,
    @Body('senderId') senderId: string,
  ): Promise<ResThreadDto> {
    const rs = await this.threadService.removeReact(threadId, senderId)
    return {
      success: rs.thread.success,
      message: rs.thread.message,
      errors: rs.thread.errors,
      data: null,
    }
  }

  @Patch(':threadId')
  @ApiBody({ type: ThreadRequestCreateDto })
  @ApiCreatedResponse({ type: ResThreadDto })
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './uploads',
  //       filename: (_, file, callback) => {
  //         const sanitizedFilename = slugify(file.originalname, {
  //           lower: true, // convert to lower case, defaults to `false`
  //           strict: true, // strip special characters except replacement, defaults to `false`
  //         })
  //         callback(null, sanitizedFilename)
  //       },
  //     }),
  //   }),
  // )
  async updateThread(
    @Param('threadId') threadId: string,
    @Body('message') messageCreateDto?: MessageCreateDto,
    @Body('react') reactCreateDto?: ReactCreateDto,
    @UploadedFile() file?: Express.Multer.File,
    @Body('senderId') senderId?: string,
    @Body('receiveId') receiveId?: string,
    @Body('channelId') channelId?: string,
    @Body('chatId') chatId?: string,
  ): Promise<Response> {
    const fileUpload: FileCreateDto = { ...file }
    const rs = await this.threadService.updateThread(
      threadId,
      messageCreateDto,
      fileUpload,
      reactCreateDto,
      senderId,
      receiveId,
      channelId,
      chatId,
    )
    if (!rs.thread.success) {
      if (file && file.path) {
        unlink(file.path, (err) => {
          if (err) {
            console.error(`Error deleting file: ${file.path}`)
            console.error(err)
          } else {
          }
        })
      }
    }
    return {
      status: rs.thread.success,
      message: rs.thread.message,
      errors: rs.thread.errors,
      data: null,
    }
  }

  @Delete(':threadId')
  async deleteThread(
    @Param('threadId') threadId: string,
  ): Promise<ResThreadDto> {
    const rs = await this.threadService.deleteThread(threadId)
    return {
      success: rs.thread.success,
      message: rs.thread.message,
      errors: rs.thread.errors,
      data: null,
    }
  }

  @Get()
  async getAllThread(@Query() raw: any, @Req() req: Request) {
    const map = new Map<string, string>(Object.entries(raw))
    let firstKey: string
    let secondKey: string
    for (const [key] of map) {
      if (!firstKey) firstKey = key
      else if (!secondKey) secondKey = key
    }

    if (firstKey === 'text') {
      const data = await this.threadService.findByText(map.get('text'))
      return {
        success: true,
        message: 'Get thread success',
        errors: '',
        data,
      }
    } else if (firstKey === 'from') {
      const rs = await this.threadService.findByDate(
        map.get('from'),
        map.get('to'),
      )

      return {
        success: true,
        message: 'Get thread success',
        errors: '',
        data: rs,
      }
    } else if (firstKey === 'channelId' || firstKey === 'chatId') {
      const rs = await this.threadService.getAllThread(
        firstKey,
        map.get(firstKey),
        req,
      )
      return {
        success: true,
        message: 'Get thread success',
        errors: '',
        data: rs,
      }
    }
  }

  @Get()
  async getThreadById(id: string) {
    const rs = await this.threadService.getThreadById(id)
    const newFiles = rs.files.map((file) => {
      return {
        ...file,
        path: `${process.env.HOST}:${process.env.APP_PORT}/api/${file.path}`,
      }
    })
    return {
      ...rs,
      files: newFiles,
    }
  }
}
