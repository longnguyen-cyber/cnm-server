/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Token } from 'src/auth/iterface/auth.interface';
import { CustomValidationPipe } from 'src/common/common.pipe';
import { FileCreateDto } from 'src/thread/dto/fileCreate.dto';
import { ResUserDto } from './dto/resUser.dto';
import { UserCreateDto } from './dto/userCreate.dto';
import { UserLoginDto } from './dto/userLogin.dto';
import { UserRequestCreateDto } from './dto/userRequestCreate.dto';
import { UserRequestLoginDto } from './dto/userRequestLogin.dto';
import { UserRequestUpdateDto } from './dto/userRequestUpdate.dto';
import { UserUpdateDto } from './dto/userUpdate.dto';
import { UserService } from './user.service';
import { Request } from 'express';
import slugify from 'slugify';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiBody({ type: UserRequestCreateDto })
  @ApiCreatedResponse({ type: ResUserDto })
  @UsePipes(new CustomValidationPipe())
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const sanitizedFilename = slugify(file.originalname, {
            lower: true, // convert to lower case, defaults to `false`
            strict: true, // strip special characters except replacement, defaults to `false`
          });
          callback(null, sanitizedFilename);
        },
      }),
    }),
  )
  async createUsers(
    @Body() userCreateDto: UserCreateDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResUserDto> {
    const fileUpload: FileCreateDto = {
      ...file,
      path: file.path.replace('\\', '/'),
    };
    return await this.userService.createUser({
      ...userCreateDto,
      avatar: fileUpload.path,
    });
  }

  @Post('login')
  @ApiBody({ type: UserRequestLoginDto })
  @ApiCreatedResponse({ type: ResUserDto })
  @UsePipes(new CustomValidationPipe())
  async login(
    @Body() userLoginDto: UserLoginDto,
    @Req() request: Request,
  ): Promise<ResUserDto> {
    const user = await this.userService.login(userLoginDto, request);

    return {
      success: true,
      message: 'Login success',
      errors: null,
      data: user,
    };
  }

  @Get(':id')
  @ApiCreatedResponse({ type: ResUserDto })
  async getUser(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<ResUserDto> {
    const data = await this.userService.getUser(id, request);
    return {
      success: true,
      message: 'Get all user success',
      errors: null,
      data: data,
    };
  }
  @Get()
  @ApiCreatedResponse({ type: ResUserDto })
  async getAllUser(@Req() request: Request): Promise<ResUserDto> {
    const data = await this.userService.getAllUser(request);

    // return {
    //   success: true,
    //   message: 'Get all user success',
    //   errors: null,
    //   data: data,
    // };
    return data;
  }

  @UseGuards(AuthGuard)
  @Put('update')
  @ApiHeader({
    name: 'Authorization',
    description: 'Authorization: Token jwt.token.here',
  })
  @ApiBody({ type: UserRequestUpdateDto })
  @ApiCreatedResponse({ type: ResUserDto })
  @UsePipes(new CustomValidationPipe())
  async updateCurrentUser(
    @Headers('Authorization') auth: Token,
    @Body('user') userUpdateDto: UserUpdateDto,
  ): Promise<ResUserDto> {
    return await this.userService.updateUser(userUpdateDto, auth);
  }
}
