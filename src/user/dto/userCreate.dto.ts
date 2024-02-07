/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger'
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class UserCreateDto {
  @ApiProperty({
    example: 'username',
    description: 'thre username of the User',
  })
  @IsNotEmpty()
  readonly name: string

  @ApiProperty({
    example: 'password',
    description: 'the password of the User',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly password: string

  @ApiProperty({
    example: 'email',
    description: 'the email of the User',
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string
}
