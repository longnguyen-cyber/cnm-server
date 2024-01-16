import { HttpStatus, Injectable } from '@nestjs/common';
import { UserCheck } from './user.check';
import { UserRepository } from './user.repository';
import {
  CommonService,
  FindOneUserDto,
  HttpExceptionCustom,
  Token,
} from '@app/common';
import { AuthService } from '../auth.service';
import { TokenDecode } from './types/tokenDecode.interface';
import { UserModel } from './model/user.model';

@Injectable()
export class UserService {
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
    private userRepository: UserRepository,
    private userCheck: UserCheck,
  ) {}

  async login({ email, password }: any): Promise<any> {
    const user = await this.checkLoginData(email, password);
    delete user.password;
    // const resUser = this.buildUserResponse({
    //   ...user,
    //   avatar: this.commonService.transferFileToURL(req, user.avatar),
    // });
    const token = this.authService.generateJWT(user.id.toString());

    return {
      user: {
        // ...resUser,
        token,
      },
    };
  }

  async getUserCurrent(token: Token): Promise<any> {
    const user = await this.getUserByToken(token);
    return this.buildUserResponse(user);
  }

  async getAllUser(): Promise<any> {
    const users = await this.userRepository.findAll();
    users.map((user) => {
      delete user.password;
      // user.avatar = this.commonService.transferFileToURL(req, user.avatar);
    });
    return users;
  }

  async getUser(condition: FindOneUserDto) {
    const user = await this.getUserById(condition.id);
    delete user.password;
    return {
      ...user,
      // avatar: this.commonService.transferFileToURL(req, user.avatar),
    };
  }

  async createUser(userCreateDto: any): Promise<any | null> {
    const userClean = { ...userCreateDto };
    const { email } = userCreateDto;
    await this.checkUniqueUser(email);
    const passwordHashed = await this.authService.hashPassword(
      userClean.password,
    );

    const data = {
      ...userClean,
      password: passwordHashed,
      status: 'active',
    };

    const tokenCreate = this.generateToken(email);
    const user = await this.userRepository.createUser(data, tokenCreate);

    return this.buildUserResponse(user);
  }

  async updateUser(userUpdateDto: any, token: Token): Promise<any> {
    const userClean = { ...userUpdateDto };
    const { id, password } = await this.getUserByToken(token);

    const isNotEmptyObject = this.commonService.isNotEmptyObject(userClean);
    this.userCheck.isNotEmptyUpdate(isNotEmptyObject);

    const { password: passwordNew, passwordOld, email } = userClean;

    await this.checkUniqueUser(email);

    await this.validatePassword(passwordNew, passwordOld, password);

    const passwordHashed = await this.generatePassword(passwordNew);

    const data = this.generateStructureUpdateUser(userClean, passwordHashed);

    const user = await this.userRepository.updateUser(id, data);

    return this.buildUserResponse(user);
  }

  getUserIdFromToken(tokenString: Token): string {
    try {
      const { id } = this.authService.decodeToken(tokenString) as TokenDecode;
      return id + '';
    } catch (error) {
      return null;
    }
  }

  async getUserByToken(tokenString: Token): Promise<UserModel> {
    const id = this.getUserIdFromToken(tokenString);
    await this.checkUserById(id);
    return await this.getUserById(id);
  }

  // @Interval(1000) // Chạy mỗi 1000ms (1 giây)
  // async handleInterval() {
  //   const now = new Date().getTime()
  //   const token = await this.userRepository.getToken()
  //   token.map((item) => {
  //     const { email, exp } = this.authService.decodeToken(
  //       item.accessToken
  //     ) as TokenDecode

  //     const timeLeft = this.convertTime(exp * 1000 - now)

  //     if (!timeLeft) {
  //       const user = this.userRepository.findOneByEmail(email)
  //       if (user) this.userRepository.deleteToken(email)
  //       else
  //         throw new HttpExceptionCustom("User not found", HttpStatus.NOT_FOUND)
  //     }
  //   })
  // }

  private async checkLoginData(
    email: string,
    password: string,
  ): Promise<UserModel> {
    try {
      await this.checkEmailExist(email);

      const user = await this.userRepository.getUserByEmail(email);
      await this.checkValidatePassword(password, user.password);

      return user;
    } catch (e) {
      throw new HttpExceptionCustom(
        'login or password incorrect',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async checkEmailExist(email: string): Promise<void> {
    const user = await this.userRepository.getUserByEmail(email);
    this.userCheck.isExistUser(!!user);
  }

  private async checkValidatePassword(
    passwordLeft: string,
    passwordRight: string,
  ): Promise<void> {
    let isValid: boolean;

    if (!passwordLeft && !passwordRight) {
      isValid = false;
    }
    isValid = await this.authService.validatePassword(
      passwordLeft,
      passwordRight,
    );
    this.userCheck.isValidPassword(isValid);
  }

  private async checkUserById(id: string): Promise<void> {
    const user = await this.userRepository.findOneById(id);
    this.userCheck.isExistUser(!!user);
  }

  private getUserById(id: string): Promise<UserModel> {
    return this.userRepository.findOneById(id);
  }

  private async validatePassword(
    passwordNew: string,
    passwordOld: string,
    password: string,
  ): Promise<void> {
    this.checkPasswordData(passwordNew, passwordOld);

    if (!passwordNew && !passwordOld) {
      return;
    }

    await this.checkValidatePassword(passwordOld, password);
  }

  private async generatePassword(password: string): Promise<string> {
    if (!password) {
      return '';
    }
    return await this.authService.hashPassword(password);
  }

  private checkPasswordData(
    passwordLeft: string,
    passwordRight: string,
  ): boolean {
    const bool =
      (passwordLeft && !passwordRight) || (!passwordLeft && passwordRight);

    return this.userCheck.isNotExistBothPassword(!!bool);
  }

  private async checkUniqueUser(email: string): Promise<void> {
    const userExists = await this.userRepository.findOneByEmail(email);

    this.userCheck.isUniqueUser(!!userExists); //alway convert to boolean if value defined like null, undefined, 0, "" => false else true
  }

  private generateStructureUpdateUser(
    userUpdateDto: any,
    passwordHashed: string,
  ): any {
    const user = { ...userUpdateDto };
    delete user.passwordOld;
    user.password = passwordHashed;
    return Object.fromEntries(
      Object.entries(user).filter(([_, value]) => value !== ''),
    );
  }

  private buildUserResponse(user: UserModel): any {
    const { name, email, avatar, displayName, phone, status } = user;
    return {
      user: {
        name,
        email,
        avatar,
        displayName,
        phone,
        status,
      },
    };
  }

  private generateToken = (email: string): any => {
    const acessToken = this.authService.generateJWT(email);
    const refreshToken = this.authService.generateJWTRefresh(email);

    return {
      accessToken: acessToken,
      refreshToken: refreshToken,
    };
  };

  private convertTime = (time: number): boolean => {
    const seconds = Math.floor(((time % 3600000) % 60000) / 1000);

    return seconds > 0;
  };
}
