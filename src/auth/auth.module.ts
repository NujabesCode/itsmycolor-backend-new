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
import { BrandsModule } from 'src/brands/brands.module';
import { CouponsModule } from 'src/coupons/coupons.module';

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
  providers: [
    AuthService, 
    JwtStrategy, 
    GoogleStrategy, 
    NaverStrategy, 
    KakaoStrategy
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {} 