import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('인증되지 않은 사용자입니다.');
    }

    // 사용자 역할이 SYSTEM_ADMIN인 경우에만 접근 허용
    if (user.role === UserRole.SYSTEM_ADMIN) {
      return true;
    }

    throw new ForbiddenException('관리자 권한이 필요합니다.');
  }
} 