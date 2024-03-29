import { Inject, Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { Valid } from './utils/validUser'

@Injectable()
export class Middleware implements NestMiddleware {
  constructor(@Inject('VALID') private valid: Valid) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let rs: any
    const body = req.body
    switch (req.url) {
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
