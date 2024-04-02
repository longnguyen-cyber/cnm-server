import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { Valid } from './utils/validUser'

@Injectable()
export class Middleware implements NestMiddleware {
  private readonly logger = new Logger(Middleware.name)
  constructor(@Inject('VALID') private valid: Valid) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let rs: any
    ///api/users/register i wanna get all path after /api
    const rawURL = req.originalUrl.split('/')
    const path = `/${rawURL[rawURL.length - 1]}`
    const apiIndex = rawURL.indexOf('api')
    const url = `/${rawURL.slice(apiIndex + 1).join('/')}`
    const body = req.body
    const ip = req.ip
    this.logger.log(
      `${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} Handling ${req.method} request to ${url} from IP: ${ip}`,
    )
    switch (path) {
      case '/register':
        rs = await this.valid.register(body)
        if (rs !== true) {
          res.status(400).send(rs)
          return
        }
        break
      case '/change-password':
        rs = await this.valid.resetPassword(body)
        if (rs !== true) {
          res.status(400).send(rs)
          return
        }
        break
    }
    console.log('next')
    next()
  }
}
