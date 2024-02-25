import {
  CACHE_MANAGER,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AppService } from './app.service'
import { Cache } from 'cache-manager'
import { AuthGuard } from './auth/guard/auth.guard'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('/health-check')
  async getHello(): Promise<string> {
    return "I'm alive!"
  }

  @Get('/all')
  @UseGuards(AuthGuard)
  async getAll(@Req() req: any) {
    if (req.error) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'Access to this resource is denied',
      }
    }
    return this.appService.getAll(req.user.id)
  }
}
