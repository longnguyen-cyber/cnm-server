import { AUTH_PACKAGE_NAME } from '@app/common';
import { NestFactory } from '@nestjs/core';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      url: process.env.AUTH_SERVICE_URL,
      protoPath: join(__dirname, '../auth.proto'),
      package: AUTH_PACKAGE_NAME,
    },
  } as GrpcOptions);
  await app.startAllMicroservices();
  console.log('Auth microservice is running');
}
bootstrap();
