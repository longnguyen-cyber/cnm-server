import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserWithTokenDto {
  @ApiProperty({
    example: 'token_string',
    description: 'Token to user',
  })
  @IsString()
  token: string;
}
