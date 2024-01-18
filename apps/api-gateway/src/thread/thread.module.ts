import { THREAD_PACKAGE_NAME, THREAD_SERVICE_NAME } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ThreadController } from './thread.controller';
import { ThreadService } from './thread.service';

@Module({
  imports: [ConfigModule],
  controllers: [ThreadController],
  providers: [
    ThreadService,
    {
      provide: THREAD_SERVICE_NAME,
      useFactory: (config: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.GRPC,
          options: {
            package: THREAD_PACKAGE_NAME,
            protoPath: join(process.cwd(), 'proto/thread.proto'),
            url: config.get('THREAD_SERVICE_URL'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class ThreadModule {}
