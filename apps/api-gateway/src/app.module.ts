import { Module } from '@nestjs/common';
import { AppController } from './app.controller';

import { ChatModule } from './chat/chat.module';
import { ThreadModule } from './thread/thread.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule, ThreadModule, ChatModule],
  controllers: [AppController],
})
export class AppModule {}
