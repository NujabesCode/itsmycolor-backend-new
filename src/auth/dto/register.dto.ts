import { ApiProperty } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  IsPhoneNumber, 
  IsOptional,
  Matches
} from 'class-validator';

export class RegisterDto {
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
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: '비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.' }
  )
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  password: string;

  @ApiProperty({ 
    description: '비밀번호 확인', 
    example: 'password123' 
  })
  @IsString({ message: '비밀번호 확인은 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호 확인은 최소 8자 이상이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호 확인을 입력해주세요.' })
  passwordConfirm: string;

  @ApiProperty({ 
    description: '이름', 
    example: '홍길동' 
  })
  @IsString({ message: '이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  name: string;

  @ApiProperty({ 
    description: '전화번호', 
    example: '01012345678',
    required: false
  })
  @IsPhoneNumber('KR', { message: '유효한 전화번호를 입력해주세요.' })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: '토큰',
    example: '1234567890',
    required: false
  })
  @IsString({ message: '토큰은 문자열이어야 합니다.' })
  @IsOptional()
  token?: string;
} 