//build function to validate user

import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'

// Path: src/utils/validUser.ts
@Injectable()
export class Valid {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  private validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      )
  }

  //valid password will have first letter is uppercase, at least 1 number, at least 1 special character
  private validatePassword = (password: string) => {
    return String(password).match(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
  }

  private nameUnique = async (name: string) => {
    const users = (await this.cacheManager.get('user')) as any
    if (users) {
      const usersParsed = JSON.parse(users)
      const nameExit = usersParsed.find((user) => user.name === name)
      return nameExit ? true : false
    }
  }

  async register(userCreateDto: any) {
    if (!userCreateDto.email) {
      return 'Email is required'
    }
    if (!userCreateDto.password) {
      return 'Password is required'
    }
    if (!userCreateDto.name) {
      return 'Name is required'
    }
    if (!this.validateEmail(userCreateDto.email)) {
      return 'Email is invalid'
    }

    if (userCreateDto.password.length < 6) {
      return 'Password must be at least 6 characters'
    }

    const nameUnique = await this.nameUnique(userCreateDto.name)
    if (nameUnique) {
      return 'Name is exist'
    }

    if (!this.validatePassword(userCreateDto.password)) {
      return 'Password must have first letter is uppercase, at least 1 number, at least 1 special character'
    }
    return true
  }

  async resetPassword(newPassword: string) {
    if (!newPassword) {
      return 'Password is required'
    }
    if (!this.validatePassword(newPassword)) {
      return 'Password must have first letter is uppercase, at least 1 number, at least 1 special character'
    }
    return true
  }
}
