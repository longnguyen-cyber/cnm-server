import {
  CACHE_MANAGER,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { AppService } from './app.service'
import { Cache } from 'cache-manager'
import { AuthGuard } from './auth/guard/auth.guard'
import { Request, Response } from 'express'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Get('/health-check')
  async getHello(@Req() request: Request): Promise<string> {
    // for (const key of value) {
    //   if (key.includes('chat') || key.includes('channel')) {
    //     await this.cacheManager.del(key)
    //   }
    // }
    // console.log(request.cookies)
    // console.log(request.signedCookies)
    // i wanna get full url

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
    } else {
      return await this.appService.getAll(req.user.id)
    }
  }
}
