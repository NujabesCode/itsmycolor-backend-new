import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('KAKAO_CLIENT_ID') || '',
      clientSecret: configService.get<string>('KAKAO_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('KAKAO_CALLBACK_URL') || '',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    try {
      const { _json } = profile;
      const kakaoAccount = _json?.kakao_account;
      const email = kakaoAccount?.email;

      if (!email) {
        throw new Error('이메일 정보를 가져올 수 없습니다.');
      }

      const user = await this.usersService.findOrCreate(email);
      return user;
    } catch (error) {
      throw error;
    }
  }
}
