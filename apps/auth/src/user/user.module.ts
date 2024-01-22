import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule, CommonModule } from '@app/common';
import { AuthModule } from '../auth.module';
import { UserCheck } from './user.check';
import { UserRepository } from './user.repository';
import { RabbitMQModule } from '@app/rabbitmq';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, UserCheck],
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    CommonModule,
    RabbitMQModule,
  ],
  exports: [UserService, UserCheck],
})
export class UserModule {}
