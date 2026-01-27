import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { BrandsService } from '../brands/brands.service';
import { BrandStatus } from '../brands/entities/brand.entity';
import { CouponsService } from '../coupons/coupons.service';
import { CouponType } from '../coupons/entities/coupon.entity';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// ADM-010: IP 기반 실패 차단을 위한 메모리 저장소 (실제 운영에서는 Redis 사용 권장)
interface IpFailureRecord {
  count: number;
  lockedUntil: Date | null;
}

@Injectable()
export class AuthService {
  // IP별 실패 횟수 추적 (메모리 기반, 실제 운영에서는 Redis 사용 권장)
  private ipFailureMap: Map<string, IpFailureRecord> = new Map();

  constructor(
    private usersService: UsersService,
    private brandsService: BrandsService,
    private jwtService: JwtService,
    private couponsService: CouponsService,
    private configService: ConfigService,
  ) {
    // 10분마다 오래된 IP 기록 정리
    setInterval(() => {
      const now = new Date();
      for (const [ip, record] of this.ipFailureMap.entries()) {
        if (record.lockedUntil && now > record.lockedUntil) {
          this.ipFailureMap.delete(ip);
        }
      }
    }, 10 * 60 * 1000);
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    if (registerDto.token) {
      await this.brandsService.brandConnect(registerDto.token, user.id);
      await this.usersService.updateRole(user.id, UserRole.BRAND_ADMIN);
    }

    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.couponsService.createCoupon(
      user.id, 
      CouponType.PERCENT, 
      10, 
      sevenDaysLater, 
      30000,
      'WELCOME10',
      '신규 회원 10% 할인 쿠폰'
    );

    return user;
  }

  async login(loginDto: LoginDto, clientIp: string = 'unknown') {
    const { email, password } = loginDto;

    // ADM-010: IP 기반 실패 차단 확인
    const ipRecord = this.ipFailureMap.get(clientIp);
    if (ipRecord?.lockedUntil && new Date() < ipRecord.lockedUntil) {
      const minutesLeft = Math.ceil((ipRecord.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`보안 잠금, ${minutesLeft}분 후 시도해주세요.`);
    }

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // IP 실패 횟수 증가
      this.incrementIpFailure(clientIp);
      throw new UnauthorizedException('가입되지 않은 계정입니다.');
    }

    // 계정 잠금 확인
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`계정이 잠금되었습니다. ${minutesLeft}분 후 다시 시도해주세요.`);
    }

    // 잠금 시간이 지났으면 잠금 해제
    if (user.lockedUntil && new Date() >= user.lockedUntil) {
      user.lockedUntil = null;
      user.loginFailureCount = 0;
      await this.usersService.update(user.id, { lockedUntil: null, loginFailureCount: 0 });
    }

    const isPasswordValid =
      user.password !== null && (await bcrypt.compare(password, user.password));

    if (!isPasswordValid) {
      // IP 실패 횟수 증가
      this.incrementIpFailure(clientIp);
      
      // 로그인 실패 횟수 증가
      const newFailureCount = (user.loginFailureCount || 0) + 1;
      
      // 5회 이상 실패 시 계정 잠금 (30분)
      if (newFailureCount >= 5) {
        const lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30분 후
        await this.usersService.update(user.id, {
          loginFailureCount: newFailureCount,
          lockedUntil,
        });
        throw new UnauthorizedException('비밀번호를 5회 이상 잘못 입력하여 계정이 30분간 잠금되었습니다.');
      }

      await this.usersService.update(user.id, { loginFailureCount: newFailureCount });
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    // 로그인 성공 시 실패 횟수 초기화
    if (user.loginFailureCount > 0) {
      await this.usersService.update(user.id, { loginFailureCount: 0, lockedUntil: null });
    }

    // IP 실패 기록 초기화
    this.ipFailureMap.delete(clientIp);

    // ADM-009: 다중 로그인 방지 - 새로운 토큰 ID 생성
    const tokenId = uuidv4();
    await this.usersService.updateLastTokenId(user.id, tokenId);

    // JWT에 jti (JWT ID) 포함
    const payload = { 
      email: user.email, 
      sub: user.id,
      jti: tokenId, // JWT ID for multi-login prevention
    };

    const brand = await this.brandsService.findByUserIdWithoutPagination(user.id);
    const hasBrand = brand !== null;
    const isBrandApproved = brand?.status === BrandStatus.APPROVED;

    return {
      accessToken: this.jwtService.sign(payload),
      hasBrand,
      isBrandApproved,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  // ADM-010: IP 실패 횟수 증가 및 잠금 처리
  private incrementIpFailure(clientIp: string) {
    const record = this.ipFailureMap.get(clientIp) || { count: 0, lockedUntil: null };
    record.count += 1;

    // 5회 이상 실패 시 IP 잠금 (10분)
    if (record.count >= 5) {
      record.lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10분 후
    }

    this.ipFailureMap.set(clientIp, record);
  }

  // IP 잠금 해제 (임시 관리용)
  clearIpLock(clientIp?: string) {
    if (clientIp) {
      this.ipFailureMap.delete(clientIp);
    } else {
      // 모든 IP 잠금 해제
      this.ipFailureMap.clear();
    }
  }

  async socialLogin(user: User) {
    const { name, phone } = user;

    const isRegistered = name !== null && phone !== null;

    const payload = { email: user.email, sub: user.id };

    const brand = await this.brandsService.findByUserIdWithoutPagination(user.id);

    return {
      hasBrand: !!brand,
      isRegistered,
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async naverLoginByCode(code: string) {
    const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NAVER_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('NAVER_CALLBACK_URL');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new UnauthorizedException('네이버 OAuth 설정이 올바르지 않습니다.');
    }

    try {
      // 네이버에서 access_token 받기
      const tokenResponse = await axios.post(
        'https://nid.naver.com/oauth2.0/token',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
          },
        }
      );

      const { access_token } = tokenResponse.data;

      if (!access_token) {
        throw new UnauthorizedException('네이버 액세스 토큰을 받을 수 없습니다.');
      }

      // 네이버에서 사용자 정보 가져오기
      const userInfoResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const naverUser = userInfoResponse.data.response;
      const email = naverUser?.email;

      if (!email) {
        throw new UnauthorizedException('네이버 이메일 정보를 가져올 수 없습니다.');
      }

      // 사용자 찾기 또는 생성
      const user = await this.usersService.findOrCreate(email);

      // 로그인 처리
      const tokenId = uuidv4();
      await this.usersService.updateLastTokenId(user.id, tokenId);

      const payload = {
        email: user.email,
        sub: user.id,
        jti: tokenId,
      };

      const brand = await this.brandsService.findByUserIdWithoutPagination(user.id);
      const hasBrand = brand !== null;
      const isRegistered = user.name !== null && user.phone !== null;

      return {
        hasBrand,
        isRegistered,
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('네이버 로그인에 실패했습니다.');
    }
  }
}
