import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientID) {
      throw new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID in .env file.');
    }
    super({
      clientID: clientID,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { emails } = profile;
      const email = emails?.[0]?.value;

      if (!email) {
        return done(new Error('이메일 정보를 가져올 수 없습니다.'), false);
      }

      const user = await this.usersService.findOrCreate(email);
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
