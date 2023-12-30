import { ApiProperty } from "@nestjs/swagger"
import { IsOptional } from "class-validator"

export class ChannelUpdateDto {
  @ApiProperty({
    example: "channelName",
    description: "the name of the channel",
    required: false
  })
  @IsOptional()
  readonly name?: string

  @ApiProperty({
    example: "status",
    description: "the status of the channel",
    required: false
  })
  @IsOptional()
  readonly status?: boolean
}
