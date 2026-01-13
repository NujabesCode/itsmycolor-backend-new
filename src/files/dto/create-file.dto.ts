import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { FileType } from '../entities/file.entity';

export class CreateFileDto {
  @ApiProperty({
    description: '원본 파일명',
    example: 'example.jpg',
  })
  @IsString({ message: '원본 파일명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '원본 파일명을 입력해주세요.' })
  originalName: string;

  @ApiProperty({
    description: '저장 파일명',
    example: '1234567890.jpg',
  })
  @IsString({ message: '저장 파일명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '저장 파일명을 입력해주세요.' })
  filename: string;

  @ApiProperty({
    description: '파일 경로',
    example: 'uploads/images',
  })
  @IsString({ message: '파일 경로는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '파일 경로를 입력해주세요.' })
  path: string;

  @ApiProperty({
    description: '파일 URL',
    example: 'https://example.com/uploads/images/1234567890.jpg',
  })
  @IsString({ message: '파일 URL은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '파일 URL을 입력해주세요.' })
  url: string;

  @ApiProperty({
    description: '파일 유형',
    enum: FileType,
    default: FileType.OTHER,
  })
  @IsEnum(FileType, { message: '올바른 파일 유형을 선택해주세요.' })
  @IsNotEmpty({ message: '파일 유형을 선택해주세요.' })
  type: FileType;

  @ApiProperty({
    description: '파일 크기',
    example: 1024,
    required: false,
  })
  @IsNumber({}, { message: '파일 크기는 숫자여야 합니다.' })
  @IsOptional()
  size?: number;

  @ApiProperty({
    description: 'MIME 타입',
    example: 'image/jpeg',
    required: false,
  })
  @IsString({ message: 'MIME 타입은 문자열이어야 합니다.' })
  @IsOptional()
  mimeType?: string;
} 