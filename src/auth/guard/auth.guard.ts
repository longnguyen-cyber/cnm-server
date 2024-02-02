import {
  CACHE_MANAGER,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Cache } from 'cache-manager'

import { HttpExceptionCustom } from '../../common/common.exception'
import { UserService } from '../../user/user.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(UserService) private userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    if (!request.headers.authorization) {
      request.error = {
        message: 'Token expired or incorrect',
        status: HttpStatus.UNAUTHORIZED,
      }
      return true
    }
    const tokenBearer = request.headers.authorization.split(' ')[1]
    const token = await this.cacheManager.get(tokenBearer)
    try {
      if (!token) {
        request.error = {
          message: 'Token expired or incorrect',
          status: HttpStatus.UNAUTHORIZED,
        }
        return true
      } else {
        request.user = JSON.parse(token as any)
        return true
      }
    } catch (error) {
      throw new HttpExceptionCustom(
        'Token expired or incorrect',
        HttpStatus.UNAUTHORIZED,
      )
    }
  }
}
