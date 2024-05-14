import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Request, Response } from 'express';
import { KakaoAuthGuard } from 'src/auth/guard/kakao.guard';
import { AuthService } from 'src/auth/auth.service';
import { NaverAuthGuard } from 'src/auth/guard/naver.guard';
import { GoogleAuthGuard } from 'src/auth/guard/google.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersDto } from './dto/users.dto';
import { CustomerService } from 'src/customer/customer.service';
import { InstructorService } from 'src/instructor/instructor.service';
import { EditUserDto } from './dto/editUser.dto';

@ApiTags('Users')
@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly customerService: CustomerService,
    private readonly instructorService: InstructorService,
  ) {}

  /* kakao 소셜 로그인 (Guard를 통해 접근) */
  @UseGuards(KakaoAuthGuard)
  @Get('Oauth/kakao')
  @ApiOperation({ summary: 'Kakao login' })
  async kakaoLogin(): Promise<void> {
    return;
  }

  @UseGuards(KakaoAuthGuard)
  @Get('Oauth/kakao/callback')
  @ApiOperation({ summary: 'Kakao callback' })
  async kakaoCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    let profile: any = req.user;
    let provider: string = profile.provider;
    let name: string = profile._json.kakao_account.name;
    let email: string = profile._json.kakao_account.email;
    let profileImage: string = profile._json.properties.profile_image;
    // birth
    let birthYear: string = profile._json.kakao_account.birthyear;
    let birthDay: string = profile._json.kakao_account.birthday;
    let birth: string = `${birthYear}.${birthDay.substring(0, 2)}.${birthDay.substring(2)}`;
    // phoneNumber
    let phone_number: string = profile._json.kakao_account.phone_number;
    let cleanedNumber: string = phone_number.replace(/\D/g, '');
    let phoneNumber: string = `010-${cleanedNumber.substring(4, 8)}-${cleanedNumber.substring(8, 13)}`;

    const exUser = await this.authService.validateUser(email, provider);
    // user가 존재할 경우 로그인 시도
    if (exUser) {
      // userType 지정되어 있지 않을 경우 userType을 선택하는 곳으로 redirect
      if (exUser.userType === null) {
        const token = await this.authService.getToken(exUser.userId);
        const query = '?token=' + token;
        res.redirect(process.env.SELECT_USERTYPE_REDIRECT_URI + `/${query}`);
      }
      // userType 지정되어 있을 경우 Home으로 redirect
      if (exUser.userType !== null) {
        const token = await this.authService.getToken(exUser.userId);
        const query = '?token=' + token;
        res.redirect(process.env.HOME_REDIRECT_URI + `/${query}`);
      }
    }
    // user가 없을 경우 새로 생성 후에 userType 지정으로 redirect
    if (exUser === null) {
      const newUserData: UsersDto = {
        email,
        profileImage,
        name,
        provider,
        birth,
        phoneNumber,
      };
      const newUser = await this.authService.createUser(newUserData);
      let userId: number = newUser.userId;

      // const accessToken = await this.authService.getToken(newUser.userId);
      res.redirect(process.env.SELECT_USERTYPE_REDIRECT_URI);
    }
  }

  /* naver 소셜 로그인 (Guard를 통해 접근) */
  @UseGuards(NaverAuthGuard)
  @Get('Oauth/naver')
  @ApiOperation({ summary: 'Naver login' })
  async naverLogin(): Promise<void> {
    return;
  }

  @UseGuards(NaverAuthGuard)
  @Get('Oauth/naver/callback')
  @ApiOperation({ summary: 'Naver callback' })
  async naverCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    let profile: any = req.user;
    let provider: string = profile.provider;
    let name: string = profile.name;
    let email: string = profile.email;
    let profileImage: string = profile.profileImage;
    // birth
    let birthYear: string = profile.birthYear;
    let birthDay: string = profile.birthday;
    let birth: string = `${birthYear}.${birthDay.substring(0, 2)}.${birthDay.substring(3)}`;
    // phoneNumber
    let phoneNumber: string = profile.mobile;

    const exUser = await this.authService.validateUser(email, provider);
    // user가 존재할 경우 로그인 시도
    if (exUser) {
      // userType 지정되어 있지 않을 경우 userType을 선택하는 곳으로 redirect
      if (exUser.userType === null) {
        // const accessToken = await this.authService.getToken(exUser.userId);

        res.redirect(process.env.SELECT_USERTYPE_REDIRECT_URI);
      }
      // userType 지정되어 있을 경우 Home으로 redirect
      if (exUser.userType !== null) {
        // const accessToken = await this.authService.getToken(exUser.userId);
        res.redirect(process.env.HOME_REDIRECT_URI);
      }
    }
    // user가 없을 경우 새로 생성 후에 userType 지정으로 redirect
    if (exUser === null) {
      const newUserData: UsersDto = {
        email,
        profileImage,
        name,
        provider,
        birth,
        phoneNumber,
      };
      const newUser = await this.authService.createUser(newUserData);
      let userId: number = newUser.userId;

      // const accessToken = await this.authService.getToken(newUser.userId);
      res.redirect(process.env.SELECT_USERTYPE_REDIRECT_URI);
    }
  }

  /* google 소셜 로그인 (Guard를 통해 접근) */
  @UseGuards(GoogleAuthGuard)
  @Get('Oauth/google')
  @ApiOperation({ summary: 'Google login' })
  async googleLogin(): Promise<void> {
    return;
  }

  @UseGuards(GoogleAuthGuard)
  @Get('Oauth/google/callback')
  @ApiOperation({ summary: 'Google callback' })
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    let profile: any = req.user;
    let provider: string = profile.provider;
    let name: string = profile._json.name;
    let email: string = profile._json.email;
    let profileImage: string = profile._json.picture;

    const exUser = await this.authService.validateUser(email, provider);
    // user가 존재할 경우 로그인 시도
    if (exUser) {
      // userType 지정되어 있지 않을 경우 userType을 선택하는 곳으로 redirect
      if (exUser.userType === null) {
        // const accessToken = await this.authService.getToken(exUser.userId);

        res.redirect(process.env.SELECT_USERTYPE_REDIRECT_URI);
      }
      // userType 지정되어 있을 경우 Home으로 redirect
      if (exUser.userType !== null) {
        // const accessToken = await this.authService.getToken(exUser.userId);
        res.redirect(process.env.HOME_REDIRECT_URI);
      }
    }
    // user가 없을 경우 새로 생성 후에 userType 지정으로 redirect
    if (exUser === null) {
      const newUserData: UsersDto = {
        email,
        profileImage,
        name,
        provider,
      };
      const newUser = await this.authService.createUser(newUserData);
      let userId: number = newUser.userId;

      // const accessToken = await this.authService.getToken(newUser.userId);
      res.redirect(process.env.SELECT_USERTYPE_REDIRECT_URI);
    }
  }

  /* 개발자를 위한 로그인 */
  @Post('login')
  @ApiBody({
    description: '로그인 정보',
    schema: {
      type: 'object',
      properties: {
        email: {
          description: '이메일',
          type: 'string',
          example: 'user@example.com',
        },
        provider: {
          description: '소셜 제공자',
          type: 'string',
          example: 'kakao',
        },
      },
      required: ['email', 'provider'],
    },
  })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 400, description: '올바른 요청 형식이 아닙니다.' })
  @ApiResponse({ status: 401, description: '사용자를 찾을 수 없습니다.' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  async login(
    @Body('email') email: string,
    @Body('provider') provider: string,
    @Res() res: Response,
  ) {
    try {
      const user = await this.usersService.findUserByEmail(email, provider);
      if (!user) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: '사용자를 찾을 수 없습니다.' });
      }

      let userId: number = user.userId;
      let token: string = await this.authService.getToken(userId);

      res.cookie('authorization', token);
      return res.status(HttpStatus.OK).json({ message: '로그인 성공' });
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || '서버 오류' });
    }
  }

  /* 로그인 이후에 userType을 지정 */
  @Post('user/:userType')
  @ApiOperation({ summary: 'userType 선택' })
  @ApiParam({ name: 'userType', description: 'userType', type: 'string' })
  @ApiResponse({ status: 200, description: 'userType 지정 완료' })
  @ApiResponse({ status: 400, description: 'userType을 지정해주세요' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @ApiBearerAuth('accessToken')
  async selectUserType(
    @Param('userType') userType: string,
    @Res() res: Response,
  ) {
    try {
      if (userType !== 'customer' && userType !== 'instructor') {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'userType을 지정해주세요.' });
      }

      const { userId } = res.locals.user;
      const user = await this.usersService.findUserByPk(userId);
      if (!user) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: '유저 정보를 확인해주세요' });
      }
      if (user.userType !== null) {
        return res
          .status(HttpStatus.NOT_ACCEPTABLE)
          .json({ message: '계정에 타입이 이미 지정되어 있습니다.' });
      }

      // userType을 지정하면 둘 중에 하나의 테이블에 정보 생성
      if (userType === 'customer') {
        await this.customerService.createCustomer(userId);
      }
      if (userType === 'instructor') {
        await this.instructorService.createInstructor(userId);
      }

      await this.usersService.selectUserType(userId, userType);
      return res.status(HttpStatus.OK).json({ message: 'userType 지정 완료' });
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || '서버 오류' });
    }
  }

  /* 나의 프로필 조회 */
  @Get('user/myProfile')
  @ApiOperation({ summary: '프로필 조회' })
  @ApiResponse({
    status: 200,
    description: '프로필 조회',
    schema: {
      example: {
        email: 'test@example.com',
        userType: 'instructor',
        name: '홍길동',
        profileImage:
          'http://k.kakaocdn.net/dn/bjZYua/btsGes2FtXY/FJRzFxTN7KX16kw5HzR3kk/img_640x640.jpg',
        birth: '1995.09.13',
        phoneNumber: '010-1234-1234',
      },
    },
  })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @ApiBearerAuth('accessToken')
  async findUserProfile(@Res() res: Response) {
    try {
      const { userId } = res.locals.user;
      const userProfile = await this.usersService.findUserByPk(userId);
      if (!userProfile) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'user 정보를 찾을 수 없습니다.' });
      }

      return res.status(HttpStatus.OK).json(userProfile);
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || '서버 오류' });
    }
  }

  /* 프로필 수정 */
  @Patch('user/edit')
  @ApiOperation({ summary: '유저 프로필 수정' })
  @ApiBody({ type: EditUserDto })
  @ApiResponse({ status: 200, description: '프로필 수정 완료' })
  @ApiResponse({ status: 400, description: '프로필을 수정할 수 없습니다.' })
  @ApiResponse({ status: 500, description: '서버 오류' })
  @ApiBearerAuth('accessToken')
  async editUserProfile(
    @Body() editUserDto: EditUserDto,
    @Res() res: Response,
  ) {
    try {
      const { userId } = res.locals.user;

      await this.usersService.editUserProfile(userId, editUserDto);

      return res.status(HttpStatus.OK).json({ message: '프로필 수정 완료' });
    } catch (e) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: e.message || '서버 오류' });
    }
  }
}
