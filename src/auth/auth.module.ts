import { Module, forwardRef } from '@nestjs/common'
import { CommonModule } from '../common/common.module'
import { PrismaModule } from '../prisma/prisma.module'
import { UserModule } from '../user/user.module'
import { AuthService } from './auth.service'
@Module({
  providers: [AuthService],
  imports: [forwardRef(() => UserModule), PrismaModule, CommonModule],
  exports: [AuthService],
})
export class AuthModule {}
