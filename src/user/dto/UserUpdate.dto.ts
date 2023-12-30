import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserUpdateDto {
  @ApiProperty({
    example: 'username',
    description: 'thre username of the User',
    required: false,
  })
  @IsOptional()
  readonly name?: string;

  @ApiProperty({
    example: 'password',
    description: 'the password of the User',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  readonly passwordOld?: string;

  @ApiProperty({
    example: 'new password',
    description: 'the password of the User',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  readonly password?: string;

  @ApiProperty({
    example: 'display name',
    description: 'the display name of the User',
    required: false,
  })
  readonly displayName?: string;

  @ApiProperty({
    example: 'status',
    description: 'the status of the User',
    required: false,
    default: 'active',
  })
  readonly status?: string;

  @ApiProperty({
    example: 'phone',
    description: 'the phone of the User',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  readonly phone?: string;

  @ApiProperty({
    example: 'email',
    description: 'the email of the User',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiProperty({
    example: 'avatar',
    description: 'the avatar of the User',
    required: false,
  })
  readonly avatar?: string;
}
