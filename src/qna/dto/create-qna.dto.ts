import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { QnaType } from '../entities/qna.entity';
import { Transform } from 'class-transformer';

export class CreateQnaDto {
  @ApiProperty({ description: '문의 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '문의 내용' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '문의 유형', enum: QnaType })
  @IsEnum(QnaType)
  type: QnaType;

  @ApiProperty({ description: '상품 ID', required: false })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiProperty({ description: '비밀글 여부', required: false, default: false })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) {
      return true;
    }
    return false;
  })
  @IsOptional()
  isPrivate?: boolean;
} 