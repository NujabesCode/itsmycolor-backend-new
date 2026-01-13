import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsUUID } from 'class-validator';

export class SendPasswordResetDto {
  @ApiProperty({ description: '이메일' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyResetTokenDto {
  @ApiProperty({ description: '비밀번호 리셋 토큰' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '비밀번호 리셋 토큰' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: '새 비밀번호' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class AdminSendPasswordResetDto {
  @ApiProperty({ description: '사용자 ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
} 