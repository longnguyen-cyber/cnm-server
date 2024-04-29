import { ApiProperty } from '@nestjs/swagger'
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class UserUpdateDto {
  @ApiProperty({
    example: 'password',
    description: 'the password of the User',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  readonly oldPassword?: string

  @ApiProperty({
    example: 'new password',
    description: 'the password of the User',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  readonly password?: string

  @ApiProperty({
    example: 'phone',
    description: 'the phone of the User',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  readonly phone?: string

  @ApiProperty({
    example: 'avatar',
    description: 'the avatar of the User',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly avatar?: any
}
