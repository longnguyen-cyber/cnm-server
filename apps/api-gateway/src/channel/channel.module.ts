import { CHANNEL_PACKAGE_NAME } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { CHANNEL_SERVICE } from './constants';
@Module({
  imports: [ConfigModule],
  controllers: [ChannelController],
  providers: [
    ChannelService,
    {
      provide: CHANNEL_SERVICE,
      useFactory: (config: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.GRPC,
          options: {
            package: CHANNEL_PACKAGE_NAME,
            protoPath: join(process.cwd(), 'proto/channel.proto'),
            url: config.get('CHANNEL_SERVICE_URL'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class ChannelModule {}
