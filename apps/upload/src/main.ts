import { NestFactory } from '@nestjs/core';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { UploadModule } from './upload.module';
async function bootstrap() {
  const app = await NestFactory.create(UploadModule);

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      url: process.env.UPLOAD_SERVICE_URL,
      package: 'upload',
      protoPath: join(__dirname, '../upload.proto'),
    },
  } as GrpcOptions);
  await app.startAllMicroservices();
  console.log('Upload microservice is running');
}
bootstrap();
