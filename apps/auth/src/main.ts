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
  // const options = {
  //   'grpc.keepalive_timeout_ns1': 10000,
  //   'grpc.http2.max_pings_without_data': 2,
  //   'grpc.http2.min_time_between_pings_ms': 150000,
  // };
  const app = await NestFactory.create(AuthModule, {});

  // console.log(app);
  await NestFactory.createMicroservice<MicroserviceOptions>(AuthModule, {
    transport: Transport.GRPC,
    options: {
      url: 'localhost:5000',
      protoPath: join(__dirname, '../auth.proto'),
      package: AUTH_PACKAGE_NAME,
      'grpc.keepalive_timeout_ns1': 10000,
      'grpc.http2.max_pings_without_data': 2,
      'grpc.http2.min_time_between_pings_ms': 150000,
    },
  } as GrpcOptions);
  //change keep alive timeout to 60 seconds
  // const ssl_creds = grpc.credentials.createSsl();
  // const client = new zapr_speech_proto.Speech(this.server_address, ssl_creds);
  await app.startAllMicroservices();
  await app.listen(5000);
  console.log('Auth microservice is running');
}
bootstrap();
