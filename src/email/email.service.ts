import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailVerification } from './entities/email-verification.entity';
import { User } from '../users/entities/user.entity';
import { PasswordResetToken } from '../users/entities/password-reset-token.entity';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import {
  SendPasswordResetDto,
  VerifyResetTokenDto,
  ResetPasswordDto,
  AdminSendPasswordResetDto,
} from './dto/password-reset.dto';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(EmailVerification)
    private emailVerificationRepository: Repository<EmailVerification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    private configService: ConfigService,
  ) {
    // Nodemailer 설정
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // 연결 테스트
      this.transporter.verify((error) => {
        if (error) {
          console.error('SMTP 연결 실패:', error);
        } else {
          console.log('SMTP 서버 연결 성공');
        }
      });
    } else {
      console.warn('SMTP 설정이 없습니다. 개발 모드에서만 콘솔 출력됩니다.');
    }
  }

  async sendVerificationEmail(
    dto: SendVerificationDto,
  ): Promise<{ message: string }> {
    const { email } = dto;

    // const existingUser = await this.userRepository.findOne({
    //   where: { email },
    // });
    // if (existingUser) {
    //   throw new BadRequestException('해당 이메일로 가입된 계정이 이미 있습니다.');
    // }

    // 기존 인증 요청 삭제
    await this.emailVerificationRepository.delete({ email });

    // 6자리 인증 코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 만료 시간 설정 (10분)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // 인증 데이터 저장
    const verification = this.emailVerificationRepository.create({
      email,
      verificationCode,
      expiresAt,
    });

    await this.emailVerificationRepository.save(verification);

    // 실제 이메일 발송
    try {
      await this.sendVerificationCodeEmail(email, verificationCode);
    } catch (error) {
      console.error('이메일 발송 실패:', error);
      // 개발 환경에서는 콘솔에 출력
      console.log(`=== 개발 모드 - 인증 코드 (이메일 발송 실패) ===`);
      console.log(`받는 사람: ${email}`);
      console.log(`인증 코드: ${verificationCode}`);
      console.log(`만료 시간: 10분`);
      console.log(`에러 내용:`, error);
      console.log(`============================================`);
    }

    return { message: '인증 코드를 이메일로 발송했습니다.' };
  }

  private async sendVerificationCodeEmail(
    email: string,
    code: string,
  ): Promise<void> {
    const emailTemplate = this.generateEmailTemplate(code);
    const smtpFrom = this.configService.get<string>('SMTP_FROM', 'noreply@wepick.co.kr');

    if (this.transporter) {
      // 실제 이메일 발송
      const mailOptions = {
        from: `"잇츠마이컬러" <${smtpFrom}>`,
        to: email,
        subject: '[잇츠마이컬러] 이메일 인증 코드',
        html: emailTemplate,
      } as nodemailer.SendMailOptions;

      await this.transporter.sendMail(mailOptions);
      console.log(`이메일 발송 완료: ${email}`);
    } else {
      // SMTP 설정이 없는 경우 콘솔 출력
      console.log(`=== 이메일 발송 시뮬레이션 ===`);
      console.log(`받는 사람: ${email}`);
      console.log(`제목: [잇츠마이컬러] 이메일 인증 코드`);
      console.log(`인증 코드: ${code}`);
      console.log(`만료 시간: 10분`);
      console.log(`===============================`);
    }
  }

  private generateEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>잇츠마이컬러 이메일 인증</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0; font-size: 28px; font-weight: bold;">잇츠마이컬러</h1>
              <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 16px;">이메일 인증</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <h2 style="color: #212529; margin-bottom: 20px; font-size: 24px;">인증 코드</h2>
              <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 20px 40px; border-radius: 8px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);">
                ${code}
              </div>
              <p style="color: #6c757d; margin-top: 20px; font-size: 16px; line-height: 1.5;">
                위 인증 코드를 입력하여 이메일 인증을 완료해주세요.<br>
                <strong style="color: #dc3545;">인증 코드는 10분간 유효</strong>합니다.
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #495057; margin-top: 0; font-size: 18px;">📧 이메일 인증 안내</h3>
              <ul style="color: #6c757d; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>인증 코드를 정확히 입력해주세요</li>
                <li>대소문자를 구분하지 않습니다</li>
                <li>인증 코드는 10분 후 자동으로 만료됩니다</li>
                <li>5회 이상 실패 시 새로운 인증 코드를 요청해주세요</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e9ecef;">
              <p style="color: #adb5bd; font-size: 14px; margin: 0;">
                본 메일은 발신전용입니다. 문의사항이 있으시면 고객센터를 이용해주세요.
              </p>
              <p style="color: #adb5bd; font-size: 14px; margin: 10px 0 0 0;">
                © 2024 잇츠마이컬러. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async verifyEmail(
    dto: VerifyEmailDto,
  ): Promise<{ message: string; isValid: boolean }> {
    const { email, verificationCode } = dto;

    // 인증 데이터 조회
    const verification = await this.emailVerificationRepository.findOne({
      where: { email },
    });

    if (!verification) {
      throw new BadRequestException('인증 요청이 존재하지 않습니다.');
    }

    // 인증 시도 횟수 증가
    verification.attemptCount += 1;

    // 시도 횟수 초과 체크 (5회 제한)
    if (verification.attemptCount > 5) {
      await this.emailVerificationRepository.delete({ email });
      throw new BadRequestException('인증 시도 횟수를 초과했습니다. 다시 인증을 요청해주세요.');
    }

    // 만료 시간 체크
    if (new Date() > verification.expiresAt) {
      await this.emailVerificationRepository.delete({ email });
      throw new BadRequestException('인증 코드가 만료되었습니다. 다시 인증을 요청해주세요.');
    }

    // 인증 코드 확인
    if (verification.verificationCode !== verificationCode) {
      await this.emailVerificationRepository.save(verification);
      throw new BadRequestException('인증 코드가 일치하지 않습니다.');
    }

    // 인증 완료 처리
    verification.isVerified = true;
    await this.emailVerificationRepository.save(verification);

    return {
      message: '이메일 인증이 완료되었습니다.',
      isValid: true,
    };
  }

  async isEmailVerified(email: string): Promise<boolean> {
    const verification = await this.emailVerificationRepository.findOne({
      where: { email, isVerified: true },
    });

    // 하루가 지났을 때는 인증 거부
    if (verification && Date.now() - verification.createdAt.getTime() > 1000 * 60 * 60 * 24) {
      await this.emailVerificationRepository.delete({ email });
      return false;
    }

    return !!verification;
  }

  // 관리자용 이메일 발송 메서드
  async sendCustomEmail(
    to: string,
    subject: string,
    content: string,
    isHtml: boolean = false,
  ): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return {
        success: false,
        message: 'SMTP 설정이 없어 이메일을 발송할 수 없습니다.',
      };
    }

    try {
      const smtpFrom = this.configService.get<string>('SMTP_FROM', 'noreply@wepick.co.kr');

      const mailOptions = {
        from: `"잇츠마이컬러" <${smtpFrom}>`,
        to,
        subject,
        [isHtml ? 'html' : 'text']: content,
      } as nodemailer.SendMailOptions;

      await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        message: `이메일이 성공적으로 발송되었습니다: ${to}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('이메일 발송 실패:', error);
      return {
        success: false,
        message: `이메일 발송 실패: ${errorMessage}`,
      };
    }
  }

  // 비밀번호 변경 관련 메서드들 (토큰 기반)
  async sendPasswordResetEmail(dto: SendPasswordResetDto): Promise<{ message: string }> {
    const { email } = dto;

    console.log(`[비밀번호 재설정 요청] 이메일: "${email}"`);
    console.log(`[비밀번호 재설정 요청] 이메일 길이: ${email?.length || 0}`);
    console.log(`[비밀번호 재설정 요청] 이메일 공백 제거 후: "${email?.trim() || ''}"`);

    // 이메일 앞뒤 공백 제거 및 소문자 변환 (일관성 유지)
    const normalizedEmail = email?.trim().toLowerCase();

    // 사용자 존재 여부 확인 (정확한 매칭)
    let user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    // 정확한 매칭이 안 되면 대소문자 무시 검색 시도
    if (!user) {
      console.log(`[비밀번호 재설정 요청] 정확한 매칭 실패, 대소문자 무시 검색 시도`);
      // TypeORM의 Like를 사용하여 대소문자 무시 검색
      const users = await this.userRepository
        .createQueryBuilder('user')
        .where('LOWER(user.email) = LOWER(:email)', { email: normalizedEmail })
        .getMany();
      
      if (users.length > 0) {
        user = users[0];
        console.log(`[비밀번호 재설정 요청] 대소문자 무시 검색으로 사용자 발견: ${user.email}`);
      }
    }

    if (!user) {
      console.error(`[비밀번호 재설정 요청] 사용자를 찾을 수 없음: "${normalizedEmail}"`);
      // 디버깅을 위해 유사한 이메일 검색
      const similarUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email LIKE :pattern', { pattern: `%${normalizedEmail.split('@')[0]}%` })
        .limit(5)
        .getMany();
      console.log(`[비밀번호 재설정 요청] 유사한 이메일 검색 결과:`, similarUsers.map(u => u.email));
      
      throw new BadRequestException('등록되지 않은 이메일입니다.');
    }

    console.log(`[비밀번호 재설정 요청] 사용자 발견: ${user.email} (id: ${user.id})`);
    return this.generateAndSendResetLink(user);
  }

  /**
   * 비밀번호 리셋 링크 생성 및 발송
   */
  private async generateAndSendResetLink(user: User): Promise<{ message: string }> {
    // 기존 토큰 삭제
    await this.passwordResetTokenRepository.delete({ userId: user.id });

    // 안전한 토큰 생성
    const token = crypto.randomBytes(32).toString('hex');

    // 만료 시간 설정 (1시간)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // 토큰 저장
    const resetToken = this.passwordResetTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // 비밀번호 변경 링크 이메일 발송
    try {
      await this.sendPasswordResetLinkEmail(user.email, token);
    } catch (error) {
      console.error('비밀번호 변경 링크 이메일 발송 실패:', error);
      // 개발 환경에서는 콘솔에 토큰 출력
      if (process.env.NODE_ENV !== 'production') {
        console.log(`개발 모드 - 비밀번호 변경 토큰: ${user.email} -> ${token}`);
        console.log(`개발 모드 - 비밀번호 변경 링크: ${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001')}/find-password?token=${token}`);
      }
      // 에러를 다시 던져서 사용자에게 알림
      throw error;
    }

    return { message: '비밀번호 변경 링크를 이메일로 발송했습니다.' };
  }

  private async sendPasswordResetLinkEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    // 토큰을 URL 인코딩하여 특수문자 문제 방지
    const encodedToken = encodeURIComponent(token);
    const resetLink = `${frontendUrl}/find-password?token=${encodedToken}`;
    const emailTemplate = this.generatePasswordResetEmailTemplate(resetLink);
    const smtpFrom = this.configService.get<string>('SMTP_FROM', 'noreply@wepick.co.kr');
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (!this.transporter) {
      // SMTP 설정이 없는 경우
      console.error('SMTP 설정이 없어 이메일을 발송할 수 없습니다.');
      console.log(`=== 비밀번호 변경 링크 이메일 발송 시뮬레이션 ===`);
      console.log(`받는 사람: ${email}`);
      console.log(`제목: [잇츠마이컬러] 비밀번호 변경 링크`);
      console.log(`변경 링크: ${resetLink}`);
      console.log(`만료 시간: 1시간`);
      console.log(`============================================`);
      
      // 프로덕션 환경에서는 에러 발생, 개발 환경에서는 허용
      if (isProduction) {
        throw new BadRequestException('SMTP 설정이 없어 이메일을 발송할 수 없습니다. 관리자에게 문의해주세요.');
      }
      return; // 개발 환경에서는 시뮬레이션만 하고 종료
    }

    // 실제 이메일 발송
    try {
      const mailOptions = {
        from: `"잇츠마이컬러" <${smtpFrom}>`,
        to: email,
        subject: '[잇츠마이컬러] 비밀번호 변경 링크',
        html: emailTemplate,
      } as nodemailer.SendMailOptions;

      await this.transporter.sendMail(mailOptions);
      console.log(`비밀번호 변경 링크 이메일 발송 완료: ${email}`);
    } catch (error) {
      console.error('이메일 발송 중 오류 발생:', error);
      throw new BadRequestException('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  private generatePasswordResetEmailTemplate(resetLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>잇츠마이컬러 비밀번호 변경</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0; font-size: 28px; font-weight: bold;">잇츠마이컬러</h1>
              <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 16px;">비밀번호 변경</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <h2 style="color: #212529; margin-bottom: 20px; font-size: 24px;">비밀번호 변경 요청</h2>
              <p style="color: #6c757d; margin-bottom: 30px; font-size: 16px; line-height: 1.5;">
                비밀번호 변경 요청을 받았습니다.<br>
                아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
              </p>
              
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; margin: 20px 0; box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);">
                비밀번호 변경하기
              </a>
              
              <p style="color: #6c757d; margin-top: 20px; font-size: 14px; line-height: 1.5;">
                버튼이 작동하지 않는다면 아래 링크를 복사하여 브라우저에 직접 입력해주세요:<br>
                <a href="${resetLink}" style="color: #007bff; word-break: break-all;">${resetLink}</a>
              </p>
              
              <p style="color: #dc3545; margin-top: 20px; font-size: 14px; font-weight: bold;">
                이 링크는 1시간 후 만료됩니다.
              </p>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #856404; margin-top: 0; font-size: 18px;">🔒 보안 안내</h3>
              <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>본인이 요청하지 않은 경우 즉시 고객센터에 문의해주세요</li>
                <li>링크를 타인에게 공유하지 마세요</li>
                <li>링크는 1시간 후 자동으로 만료됩니다</li>
                <li>한 번 사용된 링크는 재사용할 수 없습니다</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e9ecef;">
              <p style="color: #adb5bd; font-size: 14px; margin: 0;">
                본 메일은 발신전용입니다. 문의사항이 있으시면 고객센터를 이용해주세요.
              </p>
              <p style="color: #adb5bd; font-size: 14px; margin: 10px 0 0 0;">
                © 2024 잇츠마이컬러. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 비밀번호 리셋 토큰 검증
   */
  async verifyResetToken(dto: VerifyResetTokenDto): Promise<{ valid: boolean; userId?: string; message: string }> {
    const { token } = dto;

    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token, isUsed: false },
      relations: ['user'],
    });

    if (!resetToken) {
      return {
        valid: false,
        message: '유효하지 않은 토큰입니다.',
      };
    }

    // 만료 시간 확인
    if (new Date() > resetToken.expiresAt) {
      await this.passwordResetTokenRepository.delete({ id: resetToken.id });
      return {
        valid: false,
        message: '토큰이 만료되었습니다.',
      };
    }

    return {
      valid: true,
      userId: resetToken.userId,
      message: '유효한 토큰입니다.',
    };
  }

  /**
   * 토큰으로 비밀번호 변경
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;

    console.log(`[비밀번호 재설정] 토큰으로 비밀번호 변경 시도`);
    console.log(`[비밀번호 재설정] 토큰 길이: ${token?.length || 0}`);
    console.log(`[비밀번호 재설정] 토큰 앞 20자: ${token?.substring(0, 20) || '없음'}`);
    console.log(`[비밀번호 재설정] 토큰 뒤 20자: ${token?.length > 20 ? token.substring(token.length - 20) : token || '없음'}`);

    // 토큰으로 검색 (isUsed 체크 전에 먼저 확인)
    // 토큰 앞뒤 공백 제거
    const trimmedToken = token?.trim();
    console.log(`[비밀번호 재설정] 공백 제거 후 토큰 길이: ${trimmedToken?.length || 0}`);
    
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token: trimmedToken },
      relations: ['user'],
    });

    if (!resetToken) {
      console.error(`[비밀번호 재설정] 토큰을 찾을 수 없음: ${token.substring(0, 10)}...`);
      throw new BadRequestException('유효하지 않은 토큰입니다.');
    }

    console.log(`[비밀번호 재설정] 토큰 발견: id=${resetToken.id}, isUsed=${resetToken.isUsed}, expiresAt=${resetToken.expiresAt}, now=${new Date()}`);

    // 이미 사용된 토큰인지 확인
    if (resetToken.isUsed) {
      console.error(`[비밀번호 재설정] 이미 사용된 토큰: ${resetToken.id}`);
      throw new BadRequestException('이미 사용된 링크입니다. 새로운 비밀번호 재설정 링크를 요청해주세요.');
    }

    // 만료 시간 확인
    const now = new Date();
    if (now > resetToken.expiresAt) {
      console.error(`[비밀번호 재설정] 토큰 만료: expiresAt=${resetToken.expiresAt}, now=${now}`);
      await this.passwordResetTokenRepository.delete({ id: resetToken.id });
      throw new BadRequestException('토큰이 만료되었습니다. 새로운 비밀번호 재설정 링크를 요청해주세요.');
    }

    // 새 비밀번호 해시화 및 저장
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.update(resetToken.userId, { password: hashedPassword });
      console.log(`[비밀번호 재설정] 비밀번호 변경 성공: userId=${resetToken.userId}`);

      // 토큰 사용 처리
      resetToken.isUsed = true;
      await this.passwordResetTokenRepository.save(resetToken);
      console.log(`[비밀번호 재설정] 토큰 사용 처리 완료: tokenId=${resetToken.id}`);
    } catch (error) {
      console.error(`[비밀번호 재설정] 비밀번호 변경 실패:`, error);
      throw new BadRequestException('비밀번호 변경 중 오류가 발생했습니다.');
    }

    return {
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  }

  /**
   * 어드민용 비밀번호 리셋 링크 발송
   */
  async adminSendPasswordResetLink(dto: AdminSendPasswordResetDto): Promise<{ message: string }> {
    const { userId } = dto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    return this.generateAndSendResetLink(user);
  }
} 