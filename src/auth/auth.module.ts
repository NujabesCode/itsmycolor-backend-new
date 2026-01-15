import { Module, DynamicModule } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BrandsModule } from '../brands/brands.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    const providers: any[] = [AuthService, JwtStrategy];
    
    // Conditionally load OAuth strategies
    if (process.env.GOOGLE_CLIENT_ID) {
      const { GoogleStrategy } = require('./strategies/google.strategy');
      providers.push(GoogleStrategy);
    }
    
    if (process.env.NAVER_CLIENT_ID) {
      const { NaverStrategy } = require('./strategies/naver.strategy');
      providers.push(NaverStrategy);
    }
    
    if (process.env.KAKAO_CLIENT_ID) {
      const { KakaoStrategy } = require('./strategies/kakao.strategy');
      providers.push(KakaoStrategy);
    }
    
    return {
      module: AuthModule,
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
      providers: providers,
      exports: [AuthService, JwtStrategy, PassportModule],
    };
  }
} 