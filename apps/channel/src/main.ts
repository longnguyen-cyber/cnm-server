import { NestFactory } from '@nestjs/core';
import { ChannelModule } from './channel.module';
import {
  GrpcOptions,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(ChannelModule);
  await NestFactory.createMicroservice<MicroserviceOptions>(ChannelModule, {
    transport: Transport.GRPC,
    options: {
      url: 'localhost:5001',
      protoPath: join(__dirname, '../auth.proto'),
      package: 'channel',
    },
  } as GrpcOptions);
  await app.startAllMicroservices();
  await app.listen(5001);
  console.log('Channel microservice is running');
}
bootstrap();
