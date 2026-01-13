import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ 
    description: '이메일', 
    example: 'user@example.com' 
  })
  @IsEmail({}, { message: '유효한 이메일을 입력해주세요.' })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @ApiProperty({ 
    description: '비밀번호', 
    example: 'password123' 
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;
} 