import { CHAT_PACKAGE_NAME } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CHAT_SERVICE } from './constants';

@Module({
  imports: [ConfigModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    {
      provide: CHAT_SERVICE,
      useFactory: (config: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.GRPC,
          options: {
            package: CHAT_PACKAGE_NAME,
            protoPath: join(process.cwd(), 'proto/chat.proto'),
            url: config.get('CHAT_SERVICE_URL'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class ChatModule {}
