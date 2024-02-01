import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule, CommonModule } from '@app/common';
import { AuthModule } from '../auth.module';
import { UserCheck } from './user.check';
import { UserRepository } from './user.repository';
import { RabbitMQModule } from '@app/rabbitmq';
import { BullModule } from '@nestjs/bull';
import { EmailConsumer } from '../consummers/email.consummer';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, UserCheck, EmailConsumer],
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    CommonModule,
    RabbitMQModule,
    BullModule.registerQueue({
      name: 'send-mail',
    }),
  ],
  exports: [UserService, UserCheck],
})
export class UserModule {}
