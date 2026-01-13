import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '이메일' })
  email: string;

  @ApiProperty({ description: '이름' })
  name: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: '인증 토큰' })
  accessToken: string;

  @ApiProperty({ description: '사용자 정보' })
  user: UserResponseDto;
} 