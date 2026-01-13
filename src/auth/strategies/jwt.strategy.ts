import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'default_secret'),
    });
  }

  async validate(payload: any) {
    const { sub: id, jti } = payload;
    const user = await this.usersService.findOne(id);
    
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // SM-009, SM-011: 계정 비활성화 시 로그인 차단
    if (!user.isActive) {
      throw new UnauthorizedException('계정이 제재되어 로그인할 수 없습니다.');
    }

    // ADM-009: 다중 로그인 방지 - 토큰 ID 검증
    if (user.lastTokenId && jti !== user.lastTokenId) {
      throw new UnauthorizedException('다른 장치에서 로그인되어 기존 세션이 종료되었습니다.');
    }
    
    return user;
  }
} 