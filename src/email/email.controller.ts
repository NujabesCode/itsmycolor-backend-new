import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import {
  SendPasswordResetDto,
  VerifyResetTokenDto,
  ResetPasswordDto,
  AdminSendPasswordResetDto,
} from './dto/password-reset.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiDoc } from '../common/decorators/swagger.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('이메일')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // 이메일 인증 코드 발송
  @Post('send-verification')
  @ApiDoc({ summary: '이메일 인증 코드 발송', description: '사용자에게 이메일 인증 코드를 발송합니다.' })
  async sendVerification(@Body() dto: SendVerificationDto) {
    return this.emailService.sendVerificationEmail(dto);
  }

  // 이메일 인증
  @Post('verify-email')
  @ApiDoc({ summary: '이메일 인증', description: '이메일 인증 코드를 검증합니다.' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailService.verifyEmail(dto);
  }

  // 비밀번호 재설정 링크 발송
  @Post('send-password-reset')
  @ApiDoc({ summary: '비밀번호 재설정 링크 발송', description: '비밀번호 재설정 링크를 이메일로 발송합니다.' })
  async sendPasswordReset(@Body() dto: SendPasswordResetDto) {
    return this.emailService.sendPasswordResetEmail(dto);
  }

  // 비밀번호 재설정 토큰 검증
  @Post('verify-reset-token')
  @ApiDoc({ summary: '비밀번호 재설정 토큰 검증', description: '재설정 토큰의 유효성을 확인합니다.' })
  async verifyResetToken(@Body() dto: VerifyResetTokenDto) {
    return this.emailService.verifyResetToken(dto);
  }

  // 비밀번호 재설정
  @Post('reset-password')
  @ApiDoc({ summary: '비밀번호 재설정', description: '토큰을 사용하여 비밀번호를 재설정합니다.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    console.log('[EmailController] reset-password 요청 받음:', {
      token: dto.token ? `${dto.token.substring(0, 20)}...` : '없음',
      tokenLength: dto.token?.length || 0,
      passwordLength: dto.newPassword?.length || 0,
    });
    return this.emailService.resetPassword(dto);
  }

  // 관리자용 비밀번호 재설정 링크 발송
  @Post('admin/send-password-reset')
  @UseGuards(AdminGuard)
  @ApiDoc({ summary: '어드민 비밀번호 재설정 링크 발송', description: '어드민이 특정 사용자에게 비밀번호 재설정 링크를 발송합니다.' })
  async adminSendPasswordReset(@Body() dto: AdminSendPasswordResetDto) {
    return this.emailService.adminSendPasswordResetLink(dto);
  }
} 