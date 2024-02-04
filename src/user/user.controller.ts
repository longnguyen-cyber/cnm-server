/* eslint-disable prettier/prettier */

import {
  Body,
  CACHE_MANAGER,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import { Cache } from 'cache-manager'
import { Response } from 'src/common/common.type'
import { AuthGuard } from '../auth/guard/auth.guard'
import { CustomValidationPipe } from '../common/common.pipe'
import { UserService } from './user.service'
import { CommonService } from '../common/common.service'

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly commonService: CommonService,
  ) {}

  @Post('register')
  // @UsePipes(new CustomValidationPipe())
  @UseInterceptors(FileInterceptor('avatar'))
  async createUsers(
    @Body() userCreateDto: any,
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<Response> {
    const limitSize = this.commonService.limitFileSize(file.size)
    if (!limitSize) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'File size is too large',
        errors: `Currently the file size has exceeded our limit (2MB). Your file size is ${this.commonService.convertToSize(file.size)}. Please try again with a smaller file.`,
      }
    }
    const data: any = {
      ...userCreateDto,
      avatar: JSON.stringify({
        fileName: file.originalname,
        file: file.buffer,
      }),
    }
    const rs = await this.userService.createUser(data)
    if (rs) {
      return {
        status: HttpStatus.CREATED,
        message: 'Create user success',
        data: rs,
      }
    } else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Create user fail',
      }
    }
  }

  @Post('login')
  @UsePipes(new CustomValidationPipe())
  async login(@Body() userLoginDto: any, @Req() req: any): Promise<Response> {
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

  @Get(':id')
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
  // @UsePipes(new CustomValidationPipe())
  @UseInterceptors(FileInterceptor('avatar'))
  async updateCurrentUser(
    @Body() userUpdateDto: any,
    @Req() req: any,
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<Response> {
    let data: any = userUpdateDto
    const limitSize = this.commonService.limitFileSize(file.size)
    if (!limitSize) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'File size is too large',
        errors: `Currently the file size has exceeded our limit (2MB). Your file size is ${this.commonService.convertToSize(file.size)}. Please try again with a smaller file.`,
      }
    }
    if (file) {
      data = {
        ...userUpdateDto,
        avatar: JSON.stringify({
          fileName: file.originalname,
          file: file.buffer,
        }),
      }
    }

    const user = await this.userService.updateUser(data, req)
    if (!user) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: 'User not found',
      }
    }
    return {
      status: HttpStatus.OK,
      message: 'Update user success',
      data: user,
    }
  }
}
