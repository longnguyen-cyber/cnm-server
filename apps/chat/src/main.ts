import { CHAT_PACKAGE_NAME } from '@app/common';
import { NestFactory } from '@nestjs/core';
import {
  GrpcOptions,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      host: '0.0.0.0',
      port: 50051,
      protoPath: join(__dirname, '../chat.proto'),
      package: CHAT_PACKAGE_NAME,
    },
  } as GrpcOptions);
  await app.listen();
  console.log('Chat microservice is running');
}
bootstrap();
