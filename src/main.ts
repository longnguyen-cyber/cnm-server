import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

if (process.env.NODE_ENV || process.env.NODE_ENV === 'prod') {
  require('module-alias/register')
}
async function bootstrap() {
  const APP_PORT = process.env.APP_PORT
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: '*',
    },
  })

  app.setGlobalPrefix('api')

  const config = new DocumentBuilder()
    .setTitle('NestJS Prisma')
    .setDescription('NestJS Prisma API description')
    .setVersion('0.1')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('doc', app, document)

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept',
  })

  await app.listen(APP_PORT, () =>
    console.log(`===>>>>🚀  Server is running on port ${APP_PORT}`),
  )
}

bootstrap()
