import { ApiProperty } from "@nestjs/swagger"
import { tokens } from "@prisma/client"

export class TokenModel implements tokens {
  @ApiProperty()
  id: string

  @ApiProperty()
  accessToken: string

  @ApiProperty()
  refreshToken: string

  @ApiProperty()
  email: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date

  @ApiProperty()
  deletedAt: Date
}
