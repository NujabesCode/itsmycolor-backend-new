import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class NotUserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('인증되지 않은 사용자입니다.');
    }

    // 사용자 역할이 USER가 아닌 경우만 접근 허용
    if (user.role !== UserRole.USER) {
      return true;
    }

    throw new ForbiddenException('높은 권한이 필요합니다.');
  }
} 