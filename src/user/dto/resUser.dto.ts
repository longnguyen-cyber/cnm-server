import { UserCreateDto } from './userCreate.dto'

export class ResUserDto extends UserCreateDto {
  id: string
  avatar: string
  displayName: string
  phone: string
  status: string
}
