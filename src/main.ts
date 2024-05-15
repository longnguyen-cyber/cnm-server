import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
async function bootstrap() {
  //use file env.dev

  const APP_PORT = process.env.APP_PORT
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: '*',
    },
  })

  // app.

  app.setGlobalPrefix('api')
  app.set('trust proxy', true)
  app.enableCors({
    origin: '*',
    methods: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  })

  await app.listen(APP_PORT, () =>
    console.log(`===>>>>🚀  Server is running on port ${APP_PORT}`)
  )
}

bootstrap()
