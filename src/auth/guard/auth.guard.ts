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

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async canActivate(context: ExecutionContext) {
    const url = context.switchToHttp().getRequest().url
    const request = context.switchToHttp().getRequest()
    const whiteList = ['/api/users/login', '/api/users/register']
    if (!request.headers.authorization && !whiteList.includes(url)) {
      throw new HttpException(
        "Oops! It seems like there's an issue with your access token. It may be invalid, missing, or expired. Please try again.",
        HttpStatus.FORBIDDEN,
      )
    } else {
      if (request.headers.authorization) {
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
            request.token = tokenBearer
            request.user = JSON.parse(token as any)
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
