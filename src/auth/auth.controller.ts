import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiDoc } from '../common/decorators/swagger.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { NaverAuthGuard } from './guards/naver-auth.guard';
import { KakaoAuthGuard } from './guards/kakao-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Request } from 'express';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiDoc({
    summary: '회원가입',
    description: '새로운 사용자를 등록합니다.',
    isCreated: true,
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: '로그인',
    description: '이메일과 비밀번호를 사용하여 인증합니다.',
  })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    // ADM-010: IP 주소 추출 (trust proxy 설정 후 req.ip 사용)
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = req.ip || 
                (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || 
                req.socket.remoteAddress || 
                'unknown';
    const clientIp = typeof ip === 'string' ? ip.split(',')[0].trim() : 'unknown';
    
    return this.authService.login(loginDto, clientIp);
  }

  // Google OAuth
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiDoc({
    summary: 'Google OAuth 로그인',
    description: 'Google OAuth를 통한 로그인을 시작합니다.',
  })
  async googleAuth(@GetUser() user: User) {
    return await this.authService.socialLogin(user);
  }

  // Naver OAuth
  @Get('naver')
  @UseGuards(NaverAuthGuard)
  @ApiDoc({
    summary: 'Naver OAuth 로그인',
    description: 'Naver OAuth를 통한 로그인을 시작합니다.',
  })
  async naverAuth(@GetUser() user: User) {
    return await this.authService.socialLogin(user);
  }

  // Kakao OAuth
  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  @ApiDoc({
    summary: 'Kakao OAuth 로그인',
    description: 'Kakao OAuth를 통한 로그인을 시작합니다.',
  })
  async kakaoAuth(@GetUser() user: User) {
    return await this.authService.socialLogin(user);
  }

  // IP 잠금 해제 (임시 관리용)
  @Post('clear-ip-lock')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'IP 잠금 해제',
    description: '모든 IP 잠금을 해제합니다. (임시 관리용)',
  })
  async clearIpLock() {
    // 모든 IP 잠금 해제
    this.authService.clearIpLock();
    return { message: '모든 IP 잠금이 해제되었습니다.' };
  }
}
