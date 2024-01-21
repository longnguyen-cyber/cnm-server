import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

import { ChatModule } from './chat/chat.module';
import { ThreadModule } from './thread/thread.module';
import { UserModule } from './user/user.module';
import { RabbitMQModule } from '@app/rabbitmq';
import { UploadModule } from 'apps/upload/src/upload.module';

@Module({
  imports: [UserModule, ThreadModule, ChatModule, RabbitMQModule, UploadModule],
  controllers: [AppController],
})
export class AppModule {}
