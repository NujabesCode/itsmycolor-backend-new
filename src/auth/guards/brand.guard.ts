import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class BrandGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('[BrandGuard] 요청 확인:', {
      path: request.path,
      method: request.method,
      userId: user?.id,
      userRole: user?.role,
      hasUser: !!user,
    });

    if (!user) {
      console.log('[BrandGuard] ❌ 인증되지 않은 사용자');
      throw new ForbiddenException('인증되지 않은 사용자입니다.');
    }

    // 사용자 역할이 BRAND_ADMIN인 경우에만 접근 허용
    if (user.role === UserRole.BRAND_ADMIN) {
      console.log('[BrandGuard] ✅ BRAND_ADMIN 권한 확인됨');
      return true;
    }

    console.log('[BrandGuard] ❌ 브랜드 권한 없음:', {
      userRole: user.role,
      requiredRole: UserRole.BRAND_ADMIN,
    });
    throw new ForbiddenException('브랜드 권한이 필요합니다.');
  }
} 