/* eslint-disable prettier/prettier */

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../auth/guard/auth.guard'
import { CommonService } from '../common/common.service'
import { Response } from '../common/common.type'
import { UserCreateDto } from './dto/userCreate.dto'
import { UserUpdateDto } from './dto/userUpdate.dto'
import { UserService } from './user.service'
import { Request } from 'express'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly commonService: CommonService
  ) {}

  @Post('register')
  // @UsePipes(new CustomValidationPipe())
  async createUsers(
    @Body() userCreateDto: UserCreateDto,
    @Req() req: Request
  ): Promise<Response | any> {
    const host = req.protocol + '://' + req.get('host')

    const rs = await this.userService.createUser(userCreateDto, host)
    if (rs) {
      return {
        status: HttpStatus.CREATED,
        message: 'Please check your email to verify your account',
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Register fail',
      }
    }
  }
  @UseGuards(AuthGuard)
  @Get('verify-email')
  async verify(@Req() req: any): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Token expired or invalid',
        errors: req.error,
      }
    }

    const rs = await this.userService.verifyUser(req.token)
    if (rs) {
      return {
        status: HttpStatus.OK,
        message: 'Verify user success',
        data: rs,
      }
    } else {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Verify user fail',
      }
    }
  }

  // 2fa
  //token will die in 30 days
  @Post('2fa/generate')
  @UseGuards(AuthGuard)
  async register(@Req() request: any): Promise<Response> {
    const { otpAuthUrl } =
      await this.userService.generateTwoFactorAuthenticationSecret(request)
    return {
      status: HttpStatus.OK,
      message: 'Generate 2FA success',
      data: await this.userService.generateQrCodeDataURL(otpAuthUrl),
    }
  }

  @Post('2fa/turn-on')
  @UseGuards(AuthGuard)
  async turnOnTwoFactorAuthentication(
    @Req() request: any,
    @Body() body: any
  ): Promise<Response> {
    const isCodeValid = this.userService.isTwoFactorAuthenticationCodeValid(
      body.twoFactorAuthenticationCode,
      request.user
    )
    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code')
    }
    const rs = await this.userService.turnOnTwoFactorAuthentication(request)
    return {
      status: HttpStatus.OK,
      message: 'Turn on 2FA success',
      data: {
        ...rs,
        token: request.token,
      },
    }
  }

  @Post('2fa/authenticate')
  @UseGuards(AuthGuard)
  async authenticate(
    @Req() request: any,
    @Body() body: any
  ): Promise<Response> {
    const isCodeValid = this.userService.isTwoFactorAuthenticationCodeValid(
      body.twoFactorAuthenticationCode,
      request.user
    )

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code')
    }
    const user2FA = await this.userService.authenticate(request.token)
    return {
      status: HttpStatus.OK,
      message: '2FA success',
      data: user2FA,
    }
  }

  @Post('login')
  @UseGuards(AuthGuard)
  async login(@Body() userLoginDto: any, @Req() req: any): Promise<Response> {
    console.log('login')
    if (req.error) {
      const user = await this.userService.login(userLoginDto)
      if (user) {
        return {
          status: HttpStatus.OK,
          message: 'Login success',
          data: user,
        }
      } else {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Login fail',
        }
      }
    } else {
      const user = req.user
      if (user) {
        return {
          status: HttpStatus.OK,
          message: 'Login success with token',
          data: req.user,
        }
      } else {
        return {
          status: HttpStatus.UNAUTHORIZED,
          message: 'Login fail',
          errors: req.error,
        }
      }
    }
  }

  //seen profile
  @UseGuards(AuthGuard)
  @Get(':id/profile')
  async getUser(@Param('id') id: string, @Req() req: any): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Please login again',
        errors: req.error,
      }
    }
    const user = await this.userService.getUser(id)
    if (user) {
      return {
        status: HttpStatus.OK,
        message: 'Get user success',
        data: user,
      }
    } else {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Get user fail',
      }
    }
  }

  @Put('update')
  @UseGuards(AuthGuard)
  async updateCurrentUser(
    @Body() userUpdateDto: UserUpdateDto,
    @Req() req: any
  ): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Please login again',
      }
    }
    const data = {
      ...userUpdateDto,
    }

    const user = await this.userService.updateUser(data, req)
    if (!user) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      }
    }
    return {
      status: HttpStatus.OK,
      message: 'Update user success',
      data: user,
    }
  }

  @Get('/search/:name')
  @UseGuards(AuthGuard)
  async search(
    @Param('name') name: string,
    @Req() req: any
  ): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Please login again',
        errors: req.error,
      }
    }
    const users = await this.userService.searchUser(name, req.user.id)
    if (users.length === 0)
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      }
    return {
      status: HttpStatus.OK,
      message: 'Search user success',
      data: users,
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() request: any): Promise<Response> {
    console.log('logout')
    await this.userService.logout(request)
    return {
      status: HttpStatus.OK,
      message: 'Logout success',
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: any, @Req() req: any): Promise<Response> {
    const host = req.get('origin')
    const rs = await this.userService.forgotPassword(body.email, host)
    if (rs) {
      return {
        status: HttpStatus.OK,
        message: 'Please check your email to reset password',
      }
    } else if (rs === null) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message:
          'Email already exists. Please check your email to reset password',
      }
    } else {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Forgot password fail',
      }
    }
  }

  @UseGuards(AuthGuard)
  @Post('reset-password')
  async changePass(@Req() req: any): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Token expired or invalid',
        errors: req.error,
      }
    }
    const rs = await this.userService.resetPassword(
      req.token,
      req.body.newPassword
    )
    if (rs) {
      return {
        status: HttpStatus.OK,
        message: 'Change password success. Please login again',
      }
    } else {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Change password fail',
      }
    }
  }

  @UseGuards(AuthGuard)
  @Put('update-setting')
  async updateSetting(@Body() body: any, @Req() req: any): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Please login again',
        errors: req.error,
      }
    }
    const rs = await this.userService.updateSetting(body, req.user.id)
    if (rs) {
      return {
        status: HttpStatus.OK,
        message: 'Update setting success',
        data: rs,
      }
    } else {
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Update setting fail',
      }
    }
  }

  @UseGuards(AuthGuard)
  @Get('my-cloud')
  async getCloudsByUserId(@Req() req: any): Promise<Response> {
    if (req.error) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Please login again',
        errors: req.error,
      }
    }
    const rs = await this.userService.getCloudsByUserId(req.user.id)
    return {
      status: HttpStatus.OK,
      message: 'Get cloud success',
      data: rs,
    }
  }
}
