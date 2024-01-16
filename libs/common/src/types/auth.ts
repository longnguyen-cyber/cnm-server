/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Empty } from './empty';

export const protobufPackage = 'auth';

export interface UserCreateDto {
  name: string;
  password: string;
  displayName: string;
  status: string;
  phone: string;
  email: string;
  avatar: string;
  isOwner: boolean;
}

export interface User {
  name: string;
  displayName: string;
  status: string;
  phone: string;
  email: string;
  avatar: string;
}

export interface UserLoginDto {
  email: string;
  password: string;
}

export interface FindOneUserDto {
  id: string;
}

export interface Users {
  users: User[];
}

export interface UpdateUserDto {
  name?: string | undefined;
  passwordOld?: string | undefined;
  displayName?: string | undefined;
  status?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  avatar?: string | undefined;
  isOwner?: boolean | undefined;
  password?: string | undefined;
  token: Token | undefined;
}

export interface Token {
  authorization: string;
}

export const AUTH_PACKAGE_NAME = 'auth';

export interface UsersServiceClient {
  register(request: UserCreateDto): Observable<User>;

  login(request: UserLoginDto): Observable<User>;

  getUser(request: FindOneUserDto): Observable<User>;

  getAllUsers(request: Empty): Observable<Users>;

  updateUser(request: UpdateUserDto): Observable<User>;
}

export interface UsersServiceController {
  register(request: UserCreateDto): Promise<User> | Observable<User> | User;

  login(request: UserLoginDto): Promise<User> | Observable<User> | User;

  getUser(request: FindOneUserDto): Promise<User> | Observable<User> | User;

  getAllUsers(request: Empty): Promise<Users> | Observable<Users> | Users;

  updateUser(request: UpdateUserDto): Promise<User> | Observable<User> | User;
}

export function UsersServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'register',
      'login',
      'getUser',
      'getAllUsers',
      'updateUser',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('UsersService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcStreamMethod('UsersService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const USERS_SERVICE_NAME = 'UsersService';
