import { NestFactory } from '@nestjs/core';
import { UploadModule } from './upload.module';

async function bootstrap() {
  const app = await NestFactory.create(UploadModule);
  app
    .listen(7500)
    .then(() => {
      console.log('Upload service is running on port 7500');
    })
    .catch(() => {});
}
bootstrap();
