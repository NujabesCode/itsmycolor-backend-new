import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: '현재 비밀번호',
    example: 'currentPassword123',
  })
  @IsString({ message: '현재 비밀번호는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '현재 비밀번호를 입력해주세요.' })
  currentPassword: string;

  @ApiProperty({
    description: '새 비밀번호',
    example: 'newPassword123!',
  })
  @IsString({ message: '새 비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: '비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.' }
  )
  @IsNotEmpty({ message: '새 비밀번호를 입력해주세요.' })
  newPassword: string;
}










