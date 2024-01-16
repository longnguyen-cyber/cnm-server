// import {
//   CanActivate,
//   Inject,
//   HttpStatus,
//   ExecutionContext,
//   Injectable,
// } from '@nestjs/common';

// import { HttpExceptionCustom } from '@app/common';

// @Injectable()
// export class AuthGuard implements CanActivate {
//   constructor(
//     @Inject(UserService) private userService: UserService,
//     @Inject(UserCheck) private userCheck: UserCheck,
//   ) {}
//   async canActivate(context: ExecutionContext) {
//     const request = context.switchToHttp().getRequest();
//     const tokenString = request.headers.authorization;
//     console.log('tokenString', tokenString);

//     const token = this.userCheck.isTokenExist(!!tokenString);
//     console.log('token', token);

//     try {
//       const user = await this.userService.getUserByToken(tokenString);
//       console.log('user', user);
//       return true;
//     } catch (error) {
//       throw new HttpExceptionCustom(
//         'Token expired or incorrect',
//         HttpStatus.UNAUTHORIZED,
//       );
//     }
//   }
// }
