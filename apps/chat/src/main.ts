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
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: process.env.CHAT_SERVICE_URL,
      protoPath: join(__dirname, '../chat.proto'),
      package: CHAT_PACKAGE_NAME,
    },
  } as GrpcOptions);
  await app.startAllMicroservices();
  console.log('Chat microservice is running');
}
bootstrap();
