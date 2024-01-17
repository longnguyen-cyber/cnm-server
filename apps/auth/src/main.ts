import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import {
  GrpcOptions,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';
import { AUTH_PACKAGE_NAME } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  await NestFactory.createMicroservice<MicroserviceOptions>(AuthModule, {
    transport: Transport.GRPC,
    options: {
      url: 'localhost:6000',
      protoPath: join(__dirname, '../auth.proto'),
      package: AUTH_PACKAGE_NAME,
    },
  } as GrpcOptions);
  await app.startAllMicroservices();
  await app.listen(6000);
  console.log('Auth microservice is running');
}
bootstrap();
