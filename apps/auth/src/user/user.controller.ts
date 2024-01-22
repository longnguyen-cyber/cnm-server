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
import { Controller } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from './user.service';

@Controller()
@UsersServiceControllerMethods()
export class UserController implements UsersServiceController {
  constructor(private readonly usersService: UserService) {}

  register(request: UserCreateDto): User | Promise<User> | Observable<User> {
    console.log(request);
    // return this.usersService.createUser(request);
    return null;
  }
  login(request: UserLoginDto): User | Promise<User> | Observable<User> {
    console.log(request);
    console.log('in controller');
    return this.usersService.login(request);
    // return null;
  }
  getUser(request: FindOneUserDto): User | Promise<User> | Observable<User> {
    return this.usersService.getUser(request);
  }
  getAllUsers(): Users | Promise<Users> | Observable<Users> {
    return this.usersService.getAllUser();
  }

  updateUser(request: UpdateUserDto): User | Promise<User> | Observable<User> {
    return this.usersService.updateUser(request, request.token);
  }
}
