import { RabbitMQService } from '@app/rabbitmq';
import { Cache } from 'cache-manager';
import {
  CACHE_MANAGER,
  CacheInterceptor,
  Controller,
  Get,
  Inject,
  UseInterceptors,
} from '@nestjs/common';
import { MailerService } from '@nest-modules/mailer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller()
export class AppController {
  constructor(
    @Inject('RabbitMQUploadService')
    private readonly rabbitMQService: RabbitMQService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly mailService: MailerService,
    @InjectQueue('send-mail') private readonly mailQueue: Queue,
  ) {}
  @Get('heath-check')
  async getHello(): Promise<any> {
    const data = {
      to: '01635080905l@gmail.com',
      name: 'kuga',
    };
    await this.mailQueue.add(
      'register',
      {
        to: data.to,
        name: data.name,
      },
      {
        removeOnComplete: true,
      },
    );
    // await this.mailService.sendMail({
    //   to: '01635080905l@gmail.com',
    //   subject: 'Welcome to my website',
    //   template: './email',
    //   context: {
    //     name: 'kuga',
    //   },
    // });
    return 'I am alive!';
  }

  @Get('get-with-cache')
  @UseInterceptors(CacheInterceptor)
  async getWithCache(): Promise<string> {
    console.log('getWithCache');
    return '';
  }

  @Get('clear-cache')
  async clearCache(): Promise<string> {
    await this.cacheManager.reset();
    return '';
  }

  @Get('set-cache')
  async setCache(): Promise<string> {
    await this.cacheManager.set('test', 'test');
    return '';
  }

  @Get('get-cache')
  async getCache(): Promise<string> {
    const value = (await this.cacheManager.get('test')) as string;
    return value;
  }
}
