import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"

export class ThreadCreateDto {
  @ApiProperty({
    example: "receiverId",
    description: "the receiverId is id of user who receive message",
    required: false
  })
  @IsOptional()
  @IsString()
  readonly receiveId?: string
}
