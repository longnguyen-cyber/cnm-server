/* eslint-disable @typescript-eslint/no-unused-vars */

import { InjectQueue } from '@nestjs/bull'
import {
  CACHE_MANAGER,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue as QueueEmail } from 'bull'
import { Cache } from 'cache-manager'
import { authenticator } from 'otplib'
import { toDataURL } from 'qrcode'
import { AuthService } from '../auth/auth.service'
import { ChatService } from '../chat/chat.service'
import { HttpExceptionCustom } from '../common/common.exception'
import { CommonService } from '../common/common.service'
import { LoginDTO } from './dto/login.dto'
import { ResUserDto } from './dto/resUser.dto'
import { UserCreateDto } from './dto/userCreate.dto'
import { UserUpdateDto } from './dto/userUpdate.dto'
import { UserCheck } from './user.check'
import { UserRepository } from './user.repository'
import { Interval } from '@nestjs/schedule'
import { UploadService } from '../upload/upload.service'

@Injectable()
export class UserService implements OnModuleInit {
  private readonly EXPIRED = 60 * 60 * 24 * 15 // 15 days
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
    private userRepository: UserRepository,
    private userCheck: UserCheck,
    private chatService: ChatService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('queue')
    private readonly mailQueue: QueueEmail,
    private readonly configService: ConfigService,
    private readonly uploadService: UploadService
  ) {}

  async onModuleInit() {
    const users = await this.userRepository.findAll()
    this.cacheManager.set('user', JSON.stringify(users), {
      ttl: this.EXPIRED, // 1 week
    })
  }

  @Interval(1000 * 60 * 60 * 24 * 10) // 10 days for update cache user
  async handleInterval() {
    await this.updateCacheUser()
  }
  async updateCacheUser() {
    const users = await this.userRepository.findAll()
    this.cacheManager.set('user', JSON.stringify(users), {
      ttl: this.EXPIRED, // 15 days
    })
  }

  async updateSetting(data: any, userId: string) {
    const updatedSetting = await this.userRepository.updateSetting(data, userId)
    if (updatedSetting) {
      await this.updateCacheUserById(userId, {
        settings: updatedSetting,
      })
      return updatedSetting
    }
    return false
  }

  async updateCacheCloud(userId: string) {
    console.time('updateCacheCloud')
    const cloud = await this.userRepository.getCloudsByUserId(userId)
    cloud.threads = cloud.threads.map((thread) => {
      thread.files = thread.files.map((file: any) => {
        file.size = this.commonService.convertToSize(file.size)
        return file
      })
      return thread
    })

    const rs = this.commonService.deleteField(
      {
        ...cloud,
        type: 'cloud',
        timeThread: cloud.updatedAt,
      },
      ['userId', 'thread', 'seen', 'mentions'],
      ['createdAt']
    )
    await this.cacheManager.set(`cloud-${userId}`, JSON.stringify(rs), {
      ttl: this.configService.get<number>('CLOUD_EXPIRED'),
    })

    console.timeEnd('updateCacheCloud')
  }

  async getCloudsByUserId(userId: string) {
    const cloudCache = await this.cacheManager.get(`cloud-${userId}`)
    if (cloudCache) {
      return JSON.parse(cloudCache as any)
    } else {
      const cloud = await this.userRepository.getCloudsByUserId(userId)
      cloud.threads = cloud.threads.map((thread) => {
        thread.files = thread.files.map((file: any) => {
          file.size = this.commonService.convertToSize(file.size)
          return file
        })
        return thread
      })

      const rs = this.commonService.deleteField(
        {
          ...cloud,
          type: 'cloud',
          timeThread: cloud.updatedAt,
        },
        ['userId', 'thread', 'seen', 'mentions'],
        ['createdAt']
      )
      await this.cacheManager.set(`cloud-${userId}`, JSON.stringify(rs), {
        ttl: this.configService.get<number>('CLOUD_EXPIRED'),
      })
      return rs
    }
  }

  async searchUser(query: string, id: string) {
    const users = (await this.cacheManager.get('user')) as any
    if (users) {
      const usersParsed = JSON.parse(users)
      const usersWithChatId = usersParsed.map((user: any) => {
        const chatId = user.chatIds.find(
          (chat: any) =>
            (chat.receiveId === user.id && chat.senderId === id) ||
            (chat.receiveId === id && chat.senderId === user.id)
        )
        return {
          user: {
            ...user,
            chatIds: undefined, // remove chatIds from user
          },
          chatId: chatId ? chatId.id : null,
        }
      })
      const userFilter = usersWithChatId.filter(
        (data: any) =>
          data.user.name.toLowerCase().includes(query.toLowerCase()) &&
          data.user.id !== id
      )

      return this.commonService.deleteField(userFilter, ['channels', 'userId'])
    }
  }

  async searchUserById(id: string) {
    const users = (await this.cacheManager.get('user')) as any
    if (users) {
      const usersParsed = JSON.parse(users)

      const user = usersParsed.find((data: any) => data.id === id)

      return this.commonService.deleteField(user, ['channels'])
    }
  }

  async login({ email, password }: any): Promise<any> {
    const user = await this.checkLoginData(email.trim(), password)
    if (user.isTwoFactorAuthenticationEnabled) {
      const token = this.authService.generateJWTRegisterAndLogin2FA(email)
      await this.cacheManager.set(token, JSON.stringify(user), {
        ttl: this.configService.get<number>('REGISTER_2FA_EXPIRED'),
      }) // 15 minutes for 2fa
      throw new HttpException(
        {
          message: 'Please provide two factor authentication code',
          token,
        },
        HttpStatus.OK
      )
    }

    const token = this.authService.generateJWT(email)
    await this.cacheManager.set(token, JSON.stringify(user), {
      ttl: this.configService.get<number>('LOGIN_EXPIRED'),
    }) // 30 days
    this.commonService.deleteField(user, ['userId'])
    return {
      ...user,
      token,
    }
  }

  async getUser(id: string) {
    const user = await this.searchUserById(id)
    const result = this.commonService.deleteField(
      {
        ...this.buildUserResponse(user),
        setting: user.settings,
      },
      ['userId']
    )
    return result
  }

  async createUser(userCreateDto: UserCreateDto, host: string) {
    const userClean = { ...userCreateDto }
    const { email, name } = userClean
    const existingName = await this.checkUserName(name)
    if (!existingName) {
      throw new HttpExceptionCustom(
        'name already exists',
        HttpStatus.BAD_REQUEST
      )
    }

    await this.checkUniqueUser(email)
    const emailExist = await this.cacheManager.get(email)
    if (emailExist) {
      throw new HttpExceptionCustom(
        'email already exists',
        HttpStatus.BAD_REQUEST
      )
    }

    this.cacheManager.set(email, true, {
      ttl: this.configService.get<number>('EMAIL_VERIFY_EXPIRED'),
    }) //expires in 15 minutes

    const accessToken = this.authService.generateJWTRegisterAndLogin2FA(email) //expires in 15 minutes
    if (userClean) {
      this.cacheManager.set(accessToken, JSON.stringify(userClean), {
        ttl: this.configService.get<number>('REGISTER_2FA_EXPIRED'),
      }) //15 minutes for verify email register
      await this.mailQueue.add(
        'register',
        {
          to: userClean.email,
          name: userClean.name,
          link: `${host}/auth/verify-email?token=${accessToken}`,
        },
        {
          removeOnComplete: true,
        }
      )
      return true
    }
    return false
  }

  async verifyUser(token: string) {
    const user = await this.cacheManager.get(token)
    if (user) {
      const userParsed = JSON.parse(user as any)
      const passwordHashed = await this.authService.hashPassword(
        userParsed.password
      )

      const data = {
        ...userParsed,
        password: passwordHashed,
      }

      const userCreated = await this.userRepository.createUser(data)
      if (userCreated) {
        this.cacheManager.del(token)
        this.cacheManager.del(userParsed.email)
        const accessToken = this.authService.generateJWT(userCreated.email)
        this.cacheManager.set(accessToken, JSON.stringify(userCreated), {
          ttl: this.configService.get<number>('LOGIN_EXPIRED'),
        }) // 30 days
        const userInCache = (await this.cacheManager.get('user')) as any
        if (userInCache) {
          const userParsed = JSON.parse(userInCache)
          const dataPush = {
            ...userCreated,
            chatIds: [],
          }
          userParsed.push(dataPush)
          this.cacheManager.set('user', JSON.stringify(userParsed), {
            ttl: this.EXPIRED,
          })
        }
        return this.commonService.deleteField(
          {
            ...userCreated,
            token: accessToken,
          },
          []
        )
      }
    }
    return false
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.cacheManager.get(token)
    if (user) {
      const userParsed = JSON.parse(user as any)
      const passwordHashed = await this.authService.hashPassword(newPassword)

      const userUpdate = await this.userRepository.updateUser(userParsed.id, {
        password: passwordHashed,
      })
      if (userUpdate) {
        this.cacheManager.del(token)
        this.cacheManager.del(userParsed.email)
        const userUpdate = {
          ...userParsed,
          password: passwordHashed,
        }
        await this.cacheManager.set(token, JSON.stringify(userUpdate), {
          ttl: this.configService.get<number>('LOGIN_EXPIRED'),
        })
        return true
      }
    }
    return false
  }

  async updateUser(userUpdateDto: UserUpdateDto, req: any): Promise<any> {
    const userClean = { ...userUpdateDto }
    const { id, password } = req.user

    //token of user when login
    const token = req.token

    const isNotEmptyObject = this.commonService.isNotEmptyObject(userUpdateDto)
    this.userCheck.isNotEmptyUpdate(isNotEmptyObject)

    const { password: passwordNew, oldPassword } = userUpdateDto
    let passwordHashed = ''
    if (passwordNew && oldPassword) {
      await this.validatePassword(passwordNew, oldPassword, password)

      passwordHashed = await this.generatePassword(passwordNew)
    }
    const data = this.generateStructureUpdateUser(userClean, passwordHashed)
    const userUpdate = await this.userRepository.updateUser(id, data)
    if (userUpdate) {
      const userUpdated = {
        ...req.user,
        ...data,
      }

      await this.cacheManager.set(token, JSON.stringify(userUpdated), {
        ttl: this.configService.get<number>('LOGIN_EXPIRED'),
      })
      await this.updateCacheUserById(id, userUpdate)
      return true
    }
    return false
  }

  async logout(req: any) {
    const token = req.token
    await this.cacheManager.del(token)
  }

  async forgotPassword(email: string, host: string) {
    const emailExist = await this.cacheManager.get(email)

    if (emailExist) {
      // throw new HttpExceptionCustom(
      //   'email already exists. Please check your email to reset password',
      //   HttpStatus.BAD_REQUEST,
      // )
      return null
    } else {
      const user = await this.userRepository.getUserByEmail(email)
      if (user) {
        const token = this.authService.generateJWTConfirm(email)
        this.cacheManager.set(email, true, {
          ttl: this.configService.get('CONFIRM_EXPIRED'),
        }) //expires in 15 minutes
        this.cacheManager.set(token, JSON.stringify(user), {
          ttl: this.configService.get('CONFIRM_EXPIRED'),
        })
        await this.mailQueue.add(
          'forgot-password',
          {
            to: email,
            name: user.name,
            link: `${host}/auth/reset-password?token=${token}`,
          },
          {
            removeOnComplete: true,
          }
        )
        return true
      }
      return false
    }
  }

  //2fa
  async generateTwoFactorAuthenticationSecret(req: any) {
    const secret = authenticator.generateSecret()
    const user = req.user
    const token = req.token

    const otpAuthUrl = authenticator.keyuri(
      user.email,
      this.configService.get('PROJECT_NAME'),
      secret
    )

    const isSet = await this.setTwoFactorAuthenticationSecret(secret, user.id)
    if (isSet) {
      this.cacheManager.set(token, JSON.stringify(isSet), {
        ttl: this.configService.get('TURN_ON_2FA_EXPIRED'),
      }) //15 minutes
    }

    return {
      secret,
      otpAuthUrl,
    }
  }

  private async setTwoFactorAuthenticationSecret(
    secret: string,
    userId: string
  ): Promise<any> {
    const update = await this.userRepository.updateUser(userId, {
      twoFactorAuthenticationSecret: secret,
    })
    return update
  }

  async turnOnTwoFactorAuthentication(req: any) {
    const update = await this.userRepository.updateUser(req.user.id, {
      isTwoFactorAuthenticationEnabled: true,
    })
    if (update) {
      this.cacheManager.set(req.token, JSON.stringify(update))
    }

    return this.commonService.deleteField(update, [])
  }

  async generateQrCodeDataURL(otpAuthUrl: string) {
    return toDataURL(otpAuthUrl)
  }

  isTwoFactorAuthenticationCodeValid(
    twoFactorAuthenticationCode: string,
    user: any
  ) {
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: user.twoFactorAuthenticationSecret,
    })
  }

  async authenticate(token: string) {
    const user = await this.cacheManager.get(token)
    if (user) {
      const userParsed = JSON.parse(user as any)
      const newToken = this.authService.generateJWT(userParsed.email)
      await this.cacheManager.set(newToken, JSON.stringify(userParsed), {
        ttl: this.configService.get<number>('LOGIN_EXPIRED'),
      }) // 30 days
      await this.cacheManager.del(token) //delete old token after authenticate
      return this.commonService.deleteField(
        {
          ...userParsed,
          token: newToken,
        },
        ['']
      )
    }
    return false
  }

  private async checkLoginData(
    email: string,
    password: string
  ): Promise<LoginDTO> {
    try {
      await this.checkEmailExist(email)

      const user = await this.userRepository.getUserByEmail(email)
      await this.checkValidatePassword(password, user.password)

      return user
    } catch (e) {
      throw new HttpExceptionCustom(
        'email or password incorrect',
        HttpStatus.BAD_REQUEST
      )
    }
  }

  private async checkEmailExist(email: string): Promise<void> {
    const user = await this.userRepository.getUserByEmail(email)
    this.userCheck.isExistUser(!!user)
  }

  private async checkValidatePassword(
    passwordLeft: string,
    passwordRight: string
  ): Promise<void> {
    let isValid: boolean

    if (!passwordLeft && !passwordRight) {
      isValid = false
    }
    isValid = await this.authService.validatePassword(
      passwordLeft,
      passwordRight
    )
    this.userCheck.isValidPassword(isValid)
  }

  private async validatePassword(
    passwordNew: string,
    oldPassword: string,
    password: string
  ): Promise<void> {
    //check old password and with current pass

    this.checkPasswordData(passwordNew, oldPassword)
    if (!passwordNew && !oldPassword) {
      return
    }

    await this.checkValidatePassword(oldPassword, password)
  }

  private async generatePassword(password: string): Promise<string> {
    if (!password) {
      return ''
    }
    return await this.authService.hashPassword(password)
  }

  private checkPasswordData(
    passwordLeft: string,
    passwordRight: string
  ): boolean {
    const bool =
      (passwordLeft && !passwordRight) || (!passwordLeft && passwordRight)
    return this.userCheck.isNotExistBothPassword(!!bool)
  }

  private async checkUniqueUser(email: string): Promise<void> {
    const userExists = await this.userRepository.findOneByEmail(email)

    this.userCheck.isUniqueUser(!!userExists) //alway convert to boolean if value defined like null, undefined, 0, "" => false else true
  }

  private async checkUserName(name: string): Promise<boolean> {
    const userExists = await this.userRepository.findOneByName(name)

    //alway convert to boolean if value defined like null, undefined, 0, "" => false else true
    return this.userCheck.isUniqueUser(!!userExists)
  }

  private generateStructureUpdateUser(
    userUpdateDto: any,
    passwordHashed?: string
  ): any {
    const user = { ...userUpdateDto }
    delete user.oldPassword
    if (passwordHashed) {
      user.password = passwordHashed
    }
    return Object.fromEntries(
      Object.entries(user).filter(([_, value]) => value !== '')
    )
  }

  private buildUserResponse(user: ResUserDto): any {
    console.log(user)
    const {
      name,
      email,
      status,
      id,
      isTwoFactorAuthenticationEnabled,
      twoFactorAuthenticationSecret,
    } = user
    return {
      id,
      name,
      email,
      avatar: user.avatar ?? '',
      status,
      isTwoFactorAuthenticationEnabled,
      twoFactorAuthenticationSecret,
    }
  }
  private async updateCacheUserById(id: string, data: any) {
    const user = await this.cacheManager.get('user')
    if (user) {
      const userParsed = JSON.parse(user as any)
      const userIndex = userParsed.findIndex((user: any) => user.id === id)
      if (userIndex !== -1) {
        userParsed[userIndex] = {
          ...userParsed[userIndex],
          ...data,
        }

        this.cacheManager.set('user', JSON.stringify(userParsed), {
          ttl: this.EXPIRED,
        })
      }
    }
  }
}
