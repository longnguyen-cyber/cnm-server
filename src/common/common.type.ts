import { HttpStatus } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export type Tx = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>

export type Response = {
  status: HttpStatus
  message: string
  errors?: any
  data?: any
}
