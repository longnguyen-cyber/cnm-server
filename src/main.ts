import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { CACHE_MANAGER } from '@nestjs/common'
import { Cache } from 'cache-manager'

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
    methods: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  })

  const cacheManager = app.get<Cache>(CACHE_MANAGER)
  await cacheManager.set('key', 'value')

  await app.listen(APP_PORT, () =>
    console.log(`===>>>>🚀  Server is running on port ${APP_PORT}`),
  )
}

bootstrap()
