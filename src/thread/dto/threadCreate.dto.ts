import { IsOptional, IsString } from 'class-validator'

export class ThreadCreateDto {
  @IsOptional()
  @IsString()
  readonly receiveId?: string
}
