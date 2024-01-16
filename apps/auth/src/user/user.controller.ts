import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import {
  UsersServiceController,
  UpdateUserDto,
  UsersServiceControllerMethods,
  FindOneUserDto,
  Empty,
  User,
  UserCreateDto,
  UserLoginDto,
  Users,
  Token,
} from '@app/common';
import { Observable } from 'rxjs';

@Controller()
@UsersServiceControllerMethods()
export class UserController implements UsersServiceController {
  constructor(private readonly usersService: UserService) {}
  register(request: UserCreateDto): User | Promise<User> | Observable<User> {
    return this.usersService.createUser(request);
  }
  login(request: UserLoginDto): User | Promise<User> | Observable<User> {
    return this.usersService.login(request);
  }
  getUser(request: FindOneUserDto): User | Promise<User> | Observable<User> {
    return this.usersService.getUser(request);
  }
  getAllUsers(request: Empty): Users | Promise<Users> | Observable<Users> {
    return this.usersService.getAllUser();
  }

  updateUser(request: UpdateUserDto): User | Promise<User> | Observable<User> {
    return this.usersService.updateUser(request, request.token);
  }
}
