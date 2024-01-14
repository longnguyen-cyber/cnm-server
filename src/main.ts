import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { HttpExceptionFilter } from './common/common.filter';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

if (process.env.NODE_ENV || process.env.NODE_ENV === 'prod') {
  require('module-alias/register');
}
async function bootstrap() {
  const APP_PORT = 8080;
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: '*',
    },
  });

  app.setGlobalPrefix('api');
  app.useStaticAssets(path.join(__dirname, '..', 'uploads')); // porker

  const config = new DocumentBuilder()
    .setTitle('NestJS Prisma')
    .setDescription('NestJS Prisma API description')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);
  // app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept',
  });

  await app.listen(APP_PORT, () =>
    console.log(`===>>>>🚀  Server is running on port ${APP_PORT}`),
  );
}

bootstrap();
