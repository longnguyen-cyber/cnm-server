import { Module, forwardRef } from "@nestjs/common"
import { ThreadService } from "./thread.service"
import { ThreadController } from "./thread.controller"
import { AuthModule } from "src/auth/auth.module"
import { CommonModule } from "src/common/common.module"
import { PrismaModule } from "src/prisma/prisma.module"
import { ThreadRepository } from "./thread.repository"
import { UserService } from "src/user/user.service"
import { UserCheck } from "src/user/user.check"
import { UserRepository } from "src/user/user.repository"

@Module({
  controllers: [ThreadController],
  providers: [
    ThreadService,
    ThreadRepository,
    UserService,
    UserCheck,
    UserRepository
  ],
  imports: [forwardRef(() => AuthModule), PrismaModule, CommonModule],
  exports: [ThreadService]
})
export class ThreadModule {}
