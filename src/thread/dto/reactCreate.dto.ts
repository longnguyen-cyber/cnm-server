import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, isNumber } from 'class-validator';

export class ReactCreateDto {
  @ApiProperty({
    example: '3sdf3',
    description: 'the react of the thread',
  })
  @IsNotEmpty()
  @IsString()
  readonly react: string;

  @ApiProperty({
    example: '3',
    description: 'quantity',
  })
  @IsNotEmpty()
  @IsNumber()
  readonly quantity: number;
}
