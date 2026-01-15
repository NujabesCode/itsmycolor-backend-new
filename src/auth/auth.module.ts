import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { BrandsModule } from '../brands/brands.module';
import { CouponsModule } from '../coupons/coupons.module';

const getOAuthProviders = () => {
  const providers: any[] = [AuthService, JwtStrategy];
  
  try {
    if (process.env.GOOGLE_CLIENT_ID) {
      providers.push(GoogleStrategy);
    }
  } catch (e) {
    // Ignore if GoogleStrategy fails to initialize
  }
  
  try {
    if (process.env.NAVER_CLIENT_ID) {
      providers.push(NaverStrategy);
    }
  } catch (e) {
    // Ignore if NaverStrategy fails to initialize
  }
  
  try {
    if (process.env.KAKAO_CLIENT_ID) {
      providers.push(KakaoStrategy);
    }
  } catch (e) {
    // Ignore if KakaoStrategy fails to initialize
  }
  
  return providers;
};

@Module({
  imports: [
    UsersModule,
    BrandsModule,
    CouponsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET', 'default_secret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: getOAuthProviders(),
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {} 