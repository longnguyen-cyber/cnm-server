import { CACHE_MANAGER, Controller, Get, Inject, Query } from '@nestjs/common'
import { AppService } from './app.service'
import { Cache } from 'cache-manager'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('/health-check')
  async getHello(): Promise<string> {
    console.log('cacheManager', await this.cacheManager.get('key'))
    return this.appService.getHello()
  }
}
