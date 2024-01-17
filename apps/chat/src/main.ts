import { CHAT_PACKAGE_NAME } from '@app/common';
import { NestFactory } from '@nestjs/core';
import {
  GrpcOptions,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';
import { ChatModule } from './chat.module';

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);
  await NestFactory.createMicroservice<MicroserviceOptions>(ChatModule, {
    transport: Transport.GRPC,
    options: {
      url: 'localhost:7000',
      protoPath: join(__dirname, '../chat.proto'),
      package: CHAT_PACKAGE_NAME,
    },
  } as GrpcOptions);
  await app.startAllMicroservices();
  await app.listen(7000);
  console.log('Chat microservice is running');
}
bootstrap();
