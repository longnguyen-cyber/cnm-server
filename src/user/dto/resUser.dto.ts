import { UserCreateDto } from './userCreate.dto'

export class ResUserDto extends UserCreateDto {
  avatar: string
  displayName: string
  phone: string
  status: string
}
