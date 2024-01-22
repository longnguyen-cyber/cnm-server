/* eslint-disable prettier/prettier */
import {
  CustomValidationPipe,
  Token,
  UpdateUserDto,
  UserCreateDto,
  UserLoginDto,
} from '@app/common';

import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @UsePipes(new CustomValidationPipe())
  @UseInterceptors(FileInterceptor('avatar'))
  async createUsers(
    @Body() userCreateDto: any,
    @UploadedFile()
    file: Express.Multer.File,
  ): Promise<any> {
    const data: UserCreateDto = {
      ...userCreateDto,
      avatar: JSON.stringify({
        fileName: file.originalname,
        file: file.buffer,
      }),
    };
    return this.userService.create(data);
  }

  @Post('login')
  @UsePipes(new CustomValidationPipe())
  async login(
    @Body() userLoginDto: UserLoginDto,
    // @Req() request: Request,
  ): Promise<any> {
    const user = this.userService.loginUSer(userLoginDto);

    return {
      success: true,
      message: 'Login success',
      errors: null,
      data: user,
    };
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<any> {
    const data = this.userService.findOne(id);
    return {
      success: true,
      message: 'Get user success',
      errors: null,
      data: data,
    };
  }
  @Get()
  async getAllUser(): Promise<any> {
    const data = this.userService.findAll();

    return {
      success: true,
      message: 'Get all user success',
      errors: null,
      data: data,
    };
    // return data;
  }

  // @UseGuards(AuthGuard)
  @Put('update')
  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization: Token jwt.token.here',
  })
  @UsePipes(new CustomValidationPipe())
  async updateCurrentUser(
    @Headers('Authorization') auth: Token,
    @Body('user') userUpdateDto: UpdateUserDto,
  ): Promise<any> {
    return this.userService.update(auth, userUpdateDto);
  }
}
