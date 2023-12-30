import { Module, forwardRef } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService],
  imports: [forwardRef(() => UserModule), PrismaModule, CommonModule],
  exports: [AuthService],
})
export class AuthModule {}
