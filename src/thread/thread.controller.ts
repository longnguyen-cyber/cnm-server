import { Controller, Get, Query } from '@nestjs/common'
import { ThreadService } from './thread.service'

@Controller('threads')
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Get()
  async getAllThread(@Query() raw: any) {
    return await this.threadService.getAllThread()
  }
}
