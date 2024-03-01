import { OmitType } from '@nestjs/swagger'
import { UserCreateDto } from './userCreate.dto'

export class LoginDTO extends OmitType(UserCreateDto, ['name']) {
  id: string
  isTwoFactorAuthenticationEnabled?: boolean
}
