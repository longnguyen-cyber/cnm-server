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
import { Request } from 'express';
import { diskStorage } from 'multer';
import slugify from 'slugify';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Token } from 'src/auth/iterface/auth.interface';
import { CustomValidationPipe } from 'src/common/common.pipe';
import { FileCreateDto } from 'src/thread/dto/fileCreate.dto';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
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
    @Body() userCreateDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<any> {
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
  @UsePipes(new CustomValidationPipe())
  async login(
    @Body() userLoginDto: any,
    @Req() request: Request,
  ): Promise<any> {
    const user = await this.userService.login(userLoginDto, request);

    return {
      success: true,
      message: 'Login success',
      errors: null,
      data: user,
    };
  }

  @Get(':id')
  async getUser(
    @Param('id') id: string,
    @Req() request: Request,
  ): Promise<any> {
    const data = await this.userService.getUser(id, request);
    return {
      success: true,
      message: 'Get all user success',
      errors: null,
      data: data,
    };
  }
  @Get()
  async getAllUser(@Req() request: Request): Promise<any> {
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
  @UsePipes(new CustomValidationPipe())
  async updateCurrentUser(
    @Headers('Authorization') auth: Token,
    @Body('user') userUpdateDto: any,
  ): Promise<any> {
    return await this.userService.updateUser(userUpdateDto, auth);
  }
}
