import { AUTH_PACKAGE_NAME } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AUTH_SERVICE } from './constants';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [ConfigModule],
  controllers: [UserController],
  providers: [
    {
      provide: AUTH_SERVICE,
      useFactory: (config: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.GRPC,
          options: {
            package: AUTH_PACKAGE_NAME,
            protoPath: join(process.cwd(), 'proto/auth.proto'),
            url: config.get('AUTH_SERVICE_URL'),
          },
        });
      },
      inject: [ConfigService],
    },
    UserService,
  ],
})
export class UserModule {}
