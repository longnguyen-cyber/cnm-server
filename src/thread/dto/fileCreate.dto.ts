import { ApiProperty } from '@nestjs/swagger'
import { IsEmpty, IsNumber, IsString } from 'class-validator'

export class FileCreateDto {
  @ApiProperty({
    example: 'Windmill - 47905.mp4',
    description: 'the originalname of the file',
  })
  @IsString()
  @IsEmpty()
  readonly fileName: string

  @ApiProperty({
    example: 'uploads\\1690871613508-416057544.mp4',
    description: 'the path of the file after upload to s#',
  })
  @IsEmpty()
  @IsString()
  readonly path: string

  @ApiProperty({
    example: 'buffer file',
  })
  readonly buffer: any

  @ApiProperty({
    example: 82036036,
    description: 'the size of the file',
  })
  @IsEmpty()
  @IsNumber()
  readonly size: number
}
