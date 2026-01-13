import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsBoolean, IsEmail, IsUUID, IsNumber, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../users/entities/user.entity';

export class UpdateUserRoleDto {
  @ApiProperty({ 
    description: '사용자 권한',
    enum: UserRole,
    example: UserRole.CONSULTANT
  })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserStatusDto {
  @ApiProperty({ 
    description: '활성화 여부',
    example: true
  })
  @IsBoolean()
  isActive: boolean;
}

export class UpdateUserPasswordByEmailDto {
  @ApiProperty({
    description: '비밀번호를 변경할 사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '새 비밀번호',
    example: 'newPassword123',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class UserResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: '이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: '이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: '사용자 권한',
    enum: UserRole,
    example: UserRole.USER
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: '활성화 여부' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: '최근 접속일', required: false })
  @IsOptional()
  lastLoginAt?: Date;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;
}

export class UserFilterDto {
  @ApiProperty({ 
    description: '사용자 권한 필터',
    enum: UserRole,
    required: false
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ 
    description: '검색어 (이름, 이메일)',
    required: false
  })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ApiProperty({ 
    description: '활성화 여부 필터',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
  
  @ApiProperty({ 
    description: '페이지 번호', 
    required: false,
    default: 1
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ 
    description: '페이지당 항목 수', 
    required: false,
    default: 10
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
} 