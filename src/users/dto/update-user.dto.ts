import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsString, 
  MinLength, 
  IsPhoneNumber, 
  IsOptional 
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ 
    description: '이메일', 
    example: 'user@example.com',
    required: false
  })
  @IsEmail({}, { message: '유효한 이메일을 입력해주세요.' })
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    description: '비밀번호', 
    example: 'password123',
    required: false
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @IsOptional()
  password?: string;

  @ApiProperty({ 
    description: '이름', 
    example: '홍길동',
    required: false
  })
  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @IsOptional()
  name?: string;

  @ApiProperty({ 
    description: '전화번호', 
    example: '01012345678',
    required: false
  })
  @IsPhoneNumber('KR', { message: '유효한 전화번호를 입력해주세요.' })
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    description: '로그인 실패 횟수', 
    required: false
  })
  @IsOptional()
  loginFailureCount?: number;

  @ApiProperty({ 
    description: '계정 잠금 시간', 
    required: false
  })
  @IsOptional()
  lockedUntil?: Date | null;
} 