import { UserCreateDto } from './userCreate.dto'

export class ResUserDto extends UserCreateDto {
  id: string
  avatar: string
  status: string
  isTwoFactorAuthenticationEnabled: boolean
  twoFactorAuthenticationSecret: string
}
