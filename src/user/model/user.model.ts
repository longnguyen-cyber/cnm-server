import { ApiProperty } from '@nestjs/swagger';
import { users } from '@prisma/client';

export class UserModel implements users {
  @ApiProperty({ type: 'string' })
  id: string;

  @ApiProperty({ type: 'string' })
  name: string;

  @ApiProperty({ type: 'string' })
  password: string;

  @ApiProperty({ type: 'string' })
  displayName: string;

  @ApiProperty({ type: 'string' })
  status: string;

  @ApiProperty({ type: 'string' })
  phone: string;

  @ApiProperty({ type: 'string' })
  email: string;

  @ApiProperty({ type: 'boolean' })
  isOwner: boolean;

  @ApiProperty({ type: 'string' })
  avatar: string;

  @ApiProperty({ type: 'date' })
  createdAt: Date;

  @ApiProperty({ type: 'date' })
  updatedAt: Date;

  @ApiProperty({ type: 'date' })
  deletedAt: Date;

  @ApiProperty({ type: 'string[]' })
  channel: string[];

  @ApiProperty({ type: 'boolean' })
  isOnline: boolean;
}
