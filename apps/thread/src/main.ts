import { NestFactory } from '@nestjs/core';

import { THREAD_PACKAGE_NAME } from '@app/common';
import {
  GrpcOptions,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';
import { ThreadModule } from './thread.module';

async function bootstrap() {
  const app = await NestFactory.create(ThreadModule);
  await NestFactory.createMicroservice<MicroserviceOptions>(ThreadModule, {
    transport: Transport.GRPC,
    options: {
      url: 'localhost:5000',

      protoPath: join(__dirname, '../thread.proto'),
      package: THREAD_PACKAGE_NAME,
    },
  } as GrpcOptions);
  await app.startAllMicroservices();
  await app.listen(5000);
  console.log('Thread microservice is running');
}
bootstrap();
