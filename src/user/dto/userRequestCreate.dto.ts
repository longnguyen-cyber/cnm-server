import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { UserCreateDto } from './userCreate.dto';

export class UserRequestCreateDto {
  @ApiProperty({ type: UserCreateDto })
  @ValidateNested()
  user: UserCreateDto;
}
