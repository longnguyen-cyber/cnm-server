import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserCheck } from './user.check';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, UserCheck],
  imports: [forwardRef(() => AuthModule), PrismaModule, CommonModule],
  exports: [UserService, UserCheck],
})
export class UserModule {}
