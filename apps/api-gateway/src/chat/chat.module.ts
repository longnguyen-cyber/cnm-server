import { CHAT_PACKAGE_NAME } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ClientProxyFactory,
  ClientsModule,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';
import { ChatController } from './chat.controller';
import { CHAT_SERVICE } from './constants';
import { ChatService } from './chat.service';

@Module({
  imports: [ConfigModule],
  controllers: [ChatController],
  providers: [
    {
      provide: CHAT_SERVICE,
      useFactory: () => {
        return ClientProxyFactory.create({
          transport: Transport.GRPC,
          options: {
            package: CHAT_PACKAGE_NAME,
            protoPath: join(process.cwd(), 'proto/chat.proto'),

            url: 'http://localhost:5000',
          },
        });
      },
      inject: [ConfigService],
    },
    ChatService,
  ],
})
export class ChatModule {}
