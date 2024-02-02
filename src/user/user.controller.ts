/* eslint-disable prettier/prettier */

import {
  Body,
  CACHE_MANAGER,
  Controller,
  Get,
  Headers,
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
import { ApiHeader, ApiTags } from '@nestjs/swagger'
import { UserService } from './user.service'
import { CustomValidationPipe } from '../common/common.pipe'
import { Token } from '../auth/iterface/auth.interface'
import { AuthGuard } from '../auth/guard/auth.guard'
import { Cache } from 'cache-manager'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post('register')
  @UsePipes(new CustomValidationPipe())
  @UseInterceptors(FileInterceptor('avatar'))
  async createUsers(
    @Body() userCreateDto: any,
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<any> {
    const data: any = {
      ...userCreateDto,
      avatar: JSON.stringify({
        fileName: file.originalname,
        file: file.buffer,
      }),
    }
    return this.userService.createUser(data)
  }

  @Post('login')
  @UseGuards(AuthGuard)
  @UsePipes(new CustomValidationPipe())
  async login(@Body() userLoginDto: any, @Req() req: any): Promise<any> {
    if (req.error) {
      const user = await this.userService.login(userLoginDto)
      return {
        success: true,
        message: 'Login success',
        errors: null,
        data: user,
      }
    } else {
      return {
        success: true,
        message: 'Login success with token',
        errors: null,
        data: req.user,
      }
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getUser(@Param('id') id: string, @Req() req: any): Promise<any> {
    if (req.error) {
      return {
        success: false,
        message: 'Please login again',
        errors: req.error,
        data: null,
      }
    }
    const user = await this.userService.getUser(id)
    return {
      success: true,
      message: 'Get user success',
      errors: null,
      data: user,
    }
  }

  @UseGuards(AuthGuard)
  @Put('update')
  // @UsePipes(new CustomValidationPipe())
  async updateCurrentUser(
    @Body('user') userUpdateDto: any,
    @Req() req: any,
  ): Promise<any> {
    return this.userService.updateUser(userUpdateDto, req.user)
  }
}
