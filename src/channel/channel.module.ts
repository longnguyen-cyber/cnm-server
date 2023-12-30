import { Module, forwardRef } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { ChannelRepository } from './channel.repository';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserCheck } from 'src/user/user.check';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [ChannelController],
  providers: [
    ChannelService,
    ChannelRepository,
    UserService,
    UserRepository,
    UserCheck,
  ],
  imports: [forwardRef(() => AuthModule), PrismaModule, CommonModule],
  exports: [ChannelService],
})
export class ChannelModule {}
