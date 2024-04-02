import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiTags } from '@nestjs/swagger'
import { CustomValidationPipe } from '../common/common.pipe'
import { Response } from '../common/common.type'
import { ResThreadDto } from './dto/resThread.dto'
import { ThreadRequestCreateDto } from './dto/threadRequestCreate.dto'
import { ThreadService } from './thread.service'

@ApiTags('threads')
@Controller('threads')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Get()
  async getAllThread(@Query() raw: any) {
    return await this.threadService.getAllThread()
  }
}
