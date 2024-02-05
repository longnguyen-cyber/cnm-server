import {
  CACHE_MANAGER,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Cache } from 'cache-manager'

import { HttpExceptionCustom } from '../../common/common.exception'
import { AuthService } from '../auth.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly authService: AuthService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const url = context.switchToHttp().getRequest().url
    const request = context.switchToHttp().getRequest()
    const whiteList = [
      '/api/users/login',
      '/api/users/register',
      '/api/users/2fa/turn-on',
      '/api/users/2fa/generate',
    ]
    if (!request.headers.authorization && !whiteList.includes(url)) {
      throw new HttpException(
        "Oops! It seems like there's an issue with your access token. It may be invalid, missing, or expired. Please try again.",
        HttpStatus.FORBIDDEN,
      )
    } else {
      if (request.headers.authorization) {
        const tokenBearer = request.headers.authorization.split(' ')[1]
        const user = await this.cacheManager.get(tokenBearer)
        const parsedUser = JSON.parse(user as any)
        try {
          if (!parsedUser) {
            request.error = {
              message: 'Token expired or incorrect',
              status: HttpStatus.UNAUTHORIZED,
            }
            return true
          } else {
            // if (
            //   !parsedUser.isTwoFactorAuthenticationEnabled &&
            //   parsedUser.twoFactorAuthenticationSecret !== '' &&
            //   !whiteList.includes(url)
            // ) {
            //   throw new HttpException(
            //     "Oops! It seems like there's an issue with your 2FA token. It may be invalid, missing, or expired. Please try again.",
            //     HttpStatus.FORBIDDEN,
            //   )
            // }
            request.token = tokenBearer
            request.user = parsedUser
            return true
          }
        } catch (error) {
          throw new HttpExceptionCustom(
            'Token expired or incorrect',
            HttpStatus.UNAUTHORIZED,
          )
        }
      } else {
        request.error = {
          message: 'Token expired or incorrect',
          status: HttpStatus.UNAUTHORIZED,
        }
        return true
      }
    }
  }
}
