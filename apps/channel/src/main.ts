import { NestFactory } from '@nestjs/core';
import { ChannelModule } from './channel.module';
import {
  GrpcOptions,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ChannelModule,
    {
      transport: Transport.GRPC,
      options: {
        host: '0.0.0.0',
        port: 50052,
        protoPath: join(__dirname, '../auth.proto'),
        package: 'channel',
      },
    } as GrpcOptions,
  );
  await app.listen();
  console.log('Channel microservice is running');
}
bootstrap();
