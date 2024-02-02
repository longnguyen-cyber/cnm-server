import {
  Token,
  USERS_SERVICE_NAME,
  UpdateUserDto,
  UserCreateDto,
  UserLoginDto,
  UsersServiceClient,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { AUTH_SERVICE } from './constants';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Injectable()
export class UserService implements OnModuleInit {
  private userService: UsersServiceClient;
  constructor(@Inject(AUTH_SERVICE) private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.userService =
      this.client.getService<UsersServiceClient>(USERS_SERVICE_NAME);
  }
  create(createUserDto: UserCreateDto) {
    return this.userService.register(createUserDto);
  }

  findAll() {
    return this.userService.getAllUsers({});
  }

  async loginUSer(useLogin: UserLoginDto) {
    return this.userService.login(useLogin);
  }
  findOne(id: string) {
    return this.userService.getUser({ id });
  }

  update(token: Token, updateUserDto: UpdateUserDto) {
    return this.userService.updateUser({ ...updateUserDto, token });
  }

  checkUserService() {
    return 'UserService OK';
  }

  long() {
    console.log('in service');
    return this.userService.long({});
  }
}
