import { ApiProperty } from "@nestjs/swagger"
import { IsEmpty, IsNumber, IsString } from "class-validator"

export class FileCreateDto {
  @ApiProperty({
    example: "file",
    description: "the fieldname of the file"
  })
  @IsEmpty()
  @IsString()
  readonly fieldname: string

  @ApiProperty({
    example: "Windmill - 47905.mp4",
    description: "the originalname of the file"
  })
  @IsEmpty()
  @IsString()
  readonly originalname: string

  @ApiProperty({
    example: "7bit",
    description: "the encoding of the file"
  })
  @IsEmpty()
  @IsString()
  readonly encoding: string

  @ApiProperty({
    example: "video/mp4",
    description: "the mimetype of the file"
  })
  @IsEmpty()
  @IsString()
  readonly mimetype: string

  @ApiProperty({
    example: "./uploads",
    description: "the destination of the file"
  })
  @IsEmpty()
  @IsString()
  readonly destination: string

  @ApiProperty({
    example: "1690871613508-416057544.mp4",
    description: "the filename of the file"
  })
  @IsEmpty()
  @IsString()
  readonly filename: string

  @ApiProperty({
    example: "uploads\\1690871613508-416057544.mp4",
    description: "the path of the file"
  })
  @IsEmpty()
  @IsString()
  readonly path: string

  @ApiProperty({
    example: 82036036,
    description: "the size of the file"
  })
  @IsEmpty()
  @IsNumber()
  readonly size: number
}
