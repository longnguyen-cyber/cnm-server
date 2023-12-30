/* eslint-disable prettier/prettier */
import { MulterModule } from "@nestjs/platform-express"
import { AppGateway } from "./app/app.gateway"
import { AuthModule } from "./auth/auth.module"
import { ChannelModule } from "./channel/channel.module"
import { ChatModule } from "./chat/chat.module"
import { PrismaModule } from "./prisma/prisma.module"
import { ThreadController } from "./thread/thread.controller"
import { ThreadModule } from "./thread/thread.module"
import { UserModule } from "./user/user.module"
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common"
import { Middleware } from "./app.middleware"
import { UserController } from "./user/user.controller"
import { UploadModule } from "./upload/upload.module"
import { ScheduleModule } from "@nestjs/schedule"
import { ConfigModule } from "@nestjs/config"
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env.dev",
    }),
    UserModule,
    PrismaModule,
    ChatModule,
    ScheduleModule.forRoot(),
    ThreadModule,
    ChannelModule,
    //porker
    MulterModule.register({ dest: "./uploads" }),
    AuthModule,

    UploadModule
  ],
  providers: [AppGateway],
  controllers: [ThreadController, UserController]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(Middleware).forRoutes("api/threads")
  }
}
