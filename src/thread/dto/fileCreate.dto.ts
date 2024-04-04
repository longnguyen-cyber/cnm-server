import { IsEmpty, IsNumber, IsString } from 'class-validator'

export class FileCreateDto {
  @IsString()
  @IsEmpty()
  readonly filename: string

  @IsEmpty()
  @IsString()
  readonly path: string

  readonly buffer: any

  @IsEmpty()
  @IsNumber()
  readonly size: number
}
