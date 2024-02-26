/* eslint-disable @typescript-eslint/no-unused-vars */

import { InjectQueue } from '@nestjs/bull'
import {
  CACHE_MANAGER,
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
import { HttpExceptionCustom } from '../common/common.exception'
import { CommonService } from '../common/common.service'
import { Queue, UploadMethod } from '../enums'
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'
import { LoginDTO } from './dto/login.dto'
import { ResUserDto } from './dto/resUser.dto'
import { UserCreateDto } from './dto/userCreate.dto'
import { UserUpdateDto } from './dto/userUpdate.dto'
import { UserCheck } from './user.check'
import { UserRepository } from './user.repository'

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
    private userRepository: UserRepository,
    private userCheck: UserCheck,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('RabbitMQUploadService')
    private readonly rabbitMQService: RabbitMQService,
    @InjectQueue('send-mail') private readonly mailQueue: QueueEmail,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const users = await this.userRepository.findAll()
    users.map((user) => {
      this.commonService.deleteField(user, [])
    })
    const userInCache = (await this.cacheManager.get('user')) as any
    if (!userInCache) {
      this.cacheManager.set('user', JSON.stringify(users))
    } else if (users.length !== JSON.parse(userInCache).length) {
      this.cacheManager.set('user', JSON.stringify(users))
    }
  }

  async searchUser(query: string, id: string) {
    const users = (await this.cacheManager.get('user')) as any
    if (users) {
      const usersParsed = JSON.parse(users)
      const userFilter = usersParsed.filter((user: any) => {
        return (
          user.name.toLowerCase().includes(query.toLowerCase()) &&
          user.id !== id
        )
      })

      return this.commonService.deleteField(userFilter, [])
    }
  }

  async login({ email, password }: any): Promise<any> {
    const user = await this.checkLoginData(email, password)
    const token = this.authService.generateJWT(user.id.toString())
    await this.cacheManager.set(token, JSON.stringify(user))
    this.commonService.deleteField(user, [])
    return {
      ...user,
      token,
    }
  }

  async getUser(id: string) {
    const user = await this.userRepository.findOneById(id)
    const result = this.commonService.deleteField(
      this.buildUserResponse(user),
      [],
    )
    return result
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.getUserByEmail(email)
    return this.commonService.deleteField(user, [])
  }

  async createUser(userCreateDto: UserCreateDto) {
    const userClean = { ...userCreateDto }

    const { email } = userClean

    await this.checkUniqueUser(email)
    const passwordHashed = await this.authService.hashPassword(
      userClean.password,
    )

    const data = {
      ...userClean,
      password: passwordHashed,
    }

    const accessToken = this.authService.generateJWT(email)
    const user = await this.userRepository.createUser(data)

    if (user) {
      this.cacheManager.set(accessToken, JSON.stringify(user))
      await this.mailQueue.add(
        'register',
        {
          to: data.email,
          name: data.name,
        },
        {
          removeOnComplete: true,
        },
      )
    }

    return this.commonService.deleteField(this.buildUserResponse(user), [,])
  }

  //old
  // async createUser(userCreateDto: UserCreateDto) {
  //   const userClean = { ...userCreateDto }

  //   const { avatar: _, email } = userClean
  //   const avatar = JSON.parse(_ as any)

  //   await this.checkUniqueUser(email)
  //   const passwordHashed = await this.authService.hashPassword(
  //     userClean.password,
  //   )
  //   const uploadFile = await this.rabbitMQService.addToQueue(
  //     Queue.Upload,
  //     UploadMethod.UploadSingle,
  //     {
  //       fileName: avatar.fileName,
  //       file: avatar.file,
  //     },
  //   )
  //   const data = {
  //     ...userClean,
  //     password: passwordHashed,
  //     status: 'active',
  //     avatar: uploadFile ? this.commonService.pathUpload(avatar.fileName) : '',
  //   }

  //   const { accessToken } = this.generateToken(email)
  //   const user = await this.userRepository.createUser(data)

  //   if (user) {
  //     this.cacheManager.set(accessToken, JSON.stringify(user))
  //     await this.mailQueue.add(
  //       'register',
  //       {
  //         to: data.email,
  //         name: data.name,
  //       },
  //       {
  //         removeOnComplete: true,
  //       },
  //     )
  //   }

  //   return this.buildUserResponse(user)
  // }

  async updateUser(userUpdateDto: UserUpdateDto, req: any): Promise<any> {
    const userClean = { ...userUpdateDto }
    const { id, password, avatar: oldAvatar } = req.user
    const token = req.token

    const isNotEmptyObject = this.commonService.isNotEmptyObject(userClean)
    this.userCheck.isNotEmptyUpdate(isNotEmptyObject)
    if (userClean.avatar) {
      const avatar = JSON.parse(userClean.avatar)
      const payload = {
        fileName: avatar.fileName,
        file: avatar.file,
        oldFileName: this.commonService.getFileName(oldAvatar),
      }
      const uploadFile = await this.rabbitMQService.addToQueue(
        Queue.Upload,
        UploadMethod.Update,
        payload,
      )
      //! throw error if upload fail
      userClean.avatar = uploadFile
        ? this.commonService.pathUpload(avatar.fileName)
        : oldAvatar
    }
    const { password: passwordNew, passwordOld } = userClean
    let passwordHashed = ''
    if (passwordNew && passwordOld) {
      await this.validatePassword(passwordNew, passwordOld, password)

      passwordHashed = await this.generatePassword(passwordNew)
    }
    const data = this.generateStructureUpdateUser(userClean, passwordHashed)

    const userUpdate = await this.userRepository.updateUser(id, data)

    if (userUpdate) {
      this.cacheManager.set(token, JSON.stringify(userUpdate))
    }
    return this.commonService.deleteField(this.buildUserResponse(userUpdate), [
      ,
    ])
  }

  //2fa
  async generateTwoFactorAuthenticationSecret(req: any) {
    const secret = authenticator.generateSecret()
    const user = req.user
    const token = req.token

    const otpAuthUrl = authenticator.keyuri(
      user.email,
      this.configService.get('PROJECT_NAME'),
      secret,
    )

    const isSet = await this.setTwoFactorAuthenticationSecret(secret, user.id)
    if (isSet) {
      this.cacheManager.set(token, JSON.stringify(isSet))
    }

    return {
      secret,
      otpAuthUrl,
    }
  }

  async setTwoFactorAuthenticationSecret(
    secret: string,
    userId: string,
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
  }

  async generateQrCodeDataURL(otpAuthUrl: string) {
    return toDataURL(otpAuthUrl)
  }

  isTwoFactorAuthenticationCodeValid(
    twoFactorAuthenticationCode: string,
    user: any,
  ) {
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: user.twoFactorAuthenticationSecret,
    })
  }

  private async checkLoginData(
    email: string,
    password: string,
  ): Promise<LoginDTO> {
    try {
      await this.checkEmailExist(email)

      const user = await this.userRepository.getUserByEmail(email)
      await this.checkValidatePassword(password, user.password)

      return user
    } catch (e) {
      throw new HttpExceptionCustom(
        'email or password incorrect',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  private async checkEmailExist(email: string): Promise<void> {
    const user = await this.userRepository.getUserByEmail(email)
    this.userCheck.isExistUser(!!user)
  }

  private async checkValidatePassword(
    passwordLeft: string,
    passwordRight: string,
  ): Promise<void> {
    let isValid: boolean

    if (!passwordLeft && !passwordRight) {
      isValid = false
    }
    isValid = await this.authService.validatePassword(
      passwordLeft,
      passwordRight,
    )
    this.userCheck.isValidPassword(isValid)
  }

  private async validatePassword(
    passwordNew: string,
    passwordOld: string,
    password: string,
  ): Promise<void> {
    this.checkPasswordData(passwordNew, passwordOld)

    if (!passwordNew && !passwordOld) {
      return
    }

    await this.checkValidatePassword(passwordOld, password)
  }

  private async generatePassword(password: string): Promise<string> {
    if (!password) {
      return ''
    }
    return await this.authService.hashPassword(password)
  }

  private checkPasswordData(
    passwordLeft: string,
    passwordRight: string,
  ): boolean {
    const bool =
      (passwordLeft && !passwordRight) || (!passwordLeft && passwordRight)

    return this.userCheck.isNotExistBothPassword(!!bool)
  }

  private async checkUniqueUser(email: string): Promise<void> {
    const userExists = await this.userRepository.findOneByEmail(email)

    this.userCheck.isUniqueUser(!!userExists) //alway convert to boolean if value defined like null, undefined, 0, "" => false else true
  }

  private generateStructureUpdateUser(
    userUpdateDto: any,
    passwordHashed?: string,
  ): any {
    const user = { ...userUpdateDto }
    delete user.passwordOld
    if (passwordHashed) {
      user.password = passwordHashed
    }
    return Object.fromEntries(
      Object.entries(user).filter(([_, value]) => value !== ''),
    )
  }

  private buildUserResponse(user: ResUserDto): any {
    const { name, email, avatar, displayName, phone, status } = user
    return {
      name,
      email,
      avatar,
      displayName,
      phone,
      status,
    }
  }

  // private generateToken = (email: string): any => {
  //   const acessToken = this.authService.generateJWT(email)
  //   const refreshToken = this.authService.generateJWTRefresh(email)

  //   return {
  //     accessToken: acessToken,
  //   }
  // }
}
