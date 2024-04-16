import { IsOptional } from 'class-validator'

export class ChannelUpdateDto {
  @IsOptional()
  readonly name?: string

  @IsOptional()
  readonly disableThread?: boolean
}
