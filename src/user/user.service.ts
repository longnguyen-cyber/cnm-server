/* eslint-disable @typescript-eslint/no-unused-vars */

import { InjectQueue } from '@nestjs/bull'
import { CACHE_MANAGER, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { Queue as QueueEmail } from 'bull'
import { Cache } from 'cache-manager'
import { AuthService } from '../auth/auth.service'
import { HttpExceptionCustom } from '../common/common.exception'
import { CommonService } from '../common/common.service'
import { Queue, UploadMethod } from '../enums'
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'
import { UserCreateDto } from './dto/userCreate.dto'
import { UserModel } from './model/user.model'
import { UserCheck } from './user.check'
import { UserRepository } from './user.repository'

@Injectable()
export class UserService {
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
    private userRepository: UserRepository,
    private userCheck: UserCheck,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('RabbitMQUploadService')
    private readonly rabbitMQService: RabbitMQService,
    @InjectQueue('send-mail') private readonly mailQueue: QueueEmail,
  ) {}

  async login({ email, password }: any): Promise<any> {
    const user = await this.checkLoginData(email, password)
    const token = this.authService.generateJWT(user.id.toString())
    await this.cacheManager.set(token, JSON.stringify(user))

    delete user.password

    return {
      ...user,
      token,
    }
  }

  async getUser(id: string) {
    const user = await this.userRepository.findOneById(id)
    return user
  }

  async createUser(userCreateDto: UserCreateDto) {
    const userClean = { ...userCreateDto }

    const { avatar: _, email } = userClean
    const avatar = JSON.parse(_ as any)

    await this.checkUniqueUser(email)
    const passwordHashed = await this.authService.hashPassword(
      userClean.password,
    )
    const uploadFile = await this.rabbitMQService.addToQueue(
      Queue.Upload,
      UploadMethod.UploadSingle,
      {
        fileName: avatar.fileName,
        file: avatar.file,
      },
    )
    const data = {
      ...userClean,
      password: passwordHashed,
      status: 'active',
      avatar: uploadFile ? this.commonService.pathUpload(avatar.fileName) : '',
    }

    const { accessToken } = this.generateToken(email)
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

    return this.buildUserResponse(user)
  }

  async updateUser(userUpdateDto: any, req: any): Promise<any> {
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
    return this.buildUserResponse(userUpdate)
  }

  private async checkLoginData(
    email: string,
    password: string,
  ): Promise<UserModel> {
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

  private buildUserResponse(user: UserModel): any {
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

  private generateToken = (email: string): any => {
    const acessToken = this.authService.generateJWT(email)
    const refreshToken = this.authService.generateJWTRefresh(email)

    return {
      accessToken: acessToken,
    }
  }
}
