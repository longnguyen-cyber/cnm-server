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
import { ChatService } from './chat.service';
import { CHAT_SERVICE } from './constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: CHAT_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: CHAT_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'proto/chat.proto'),
          url: 'localhost:7000',
          keepalive: {
            keepaliveTimeMs: 10000,
            keepaliveTimeoutMs: 5000,
          },
        },
      },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
