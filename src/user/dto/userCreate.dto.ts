/* eslint-disable prettier/prettier */
import { ApiProperty } from "@nestjs/swagger"
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength
} from "class-validator"

export class UserCreateDto {
  @ApiProperty({
    example: "username",
    description: "thre username of the User"
  })
  @IsNotEmpty()
  readonly name: string

  @ApiProperty({
    example: "password",
    description: "the password of the User"
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly password: string

  @ApiProperty({
    example: "display name",
    description: "the display name of the User"
  })
  readonly displayName: string

  @ApiProperty({
    example: "status",
    description: "the status of the User",
    default: "active"
  })
  readonly status: string

  @ApiProperty({
    example: "phone",
    description: "the phone of the User"
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  readonly phone: string

  @ApiProperty({
    example: "email",
    description: "the email of the User"
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string

  @ApiProperty({
    example: "avatar",
    description: "the avatar of the User"
  })
  readonly avatar: string

  @ApiProperty({
    example: "role",
    description: "the role of the User"
  })
  readonly isOwner: boolean
}
