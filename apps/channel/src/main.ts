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
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: process.env.CHANNEL_SERVICE_URL,
      protoPath: join(__dirname, '../channel.proto'),
      package: 'channel',
    },
  } as GrpcOptions);
  await app.startAllMicroservices();
  console.log('Channel microservice is running');
}
bootstrap();
