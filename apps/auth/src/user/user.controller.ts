import {
  FindOneUserDto,
  UpdateUserDto,
  User,
  UserCreateDto,
  UserLoginDto,
  Users,
  UsersServiceController,
  UsersServiceControllerMethods,
} from '@app/common';
import {
  UPLOAD_SERVICE_NAME,
  UploadServiceClient,
} from '@app/common/types/upload';
import { Controller, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

@Controller()
@UsersServiceControllerMethods()
export class UserController implements UsersServiceController {
  private uploadService: UploadServiceClient;
  constructor(
    private readonly usersService: UserService,
    @Inject('upload') private readonly client: ClientGrpc,
  ) {}
  OnModuleInit() {
    this.uploadService =
      this.client.getService<UploadServiceClient>(UPLOAD_SERVICE_NAME);
  }

  register(request: UserCreateDto): User | Promise<User> | Observable<User> {
    console.log(request);
    return this.usersService.createUser(request);
  }
  login(request: UserLoginDto): User | Promise<User> | Observable<User> {
    console.log(request);
    // return this.usersService.login(request);
    return null;
  }
  getUser(request: FindOneUserDto): User | Promise<User> | Observable<User> {
    console.log(request);
    return this.usersService.getUser(request);
  }
  getAllUsers(): Users | Promise<Users> | Observable<Users> {
    return this.usersService.getAllUser();
  }

  updateUser(request: UpdateUserDto): User | Promise<User> | Observable<User> {
    return this.usersService.updateUser(request, request.token);
  }
}
