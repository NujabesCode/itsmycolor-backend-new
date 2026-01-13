import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('NAVER_CLIENT_ID') || '',
      clientSecret: configService.get<string>('NAVER_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('NAVER_CALLBACK_URL') || '',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    try {
      // 네이버 프로필 구조에 맞게 이메일 추출
      const email = profile?.emails?.[0]?.value || profile?._json?.email || profile?.email;

      if (!email) {
        return done(new Error('이메일 정보를 가져올 수 없습니다.'), false);
      }

      const user = await this.usersService.findOrCreate(email);
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
}
