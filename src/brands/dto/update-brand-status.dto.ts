import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BrandStatus } from '../entities/brand.entity';

export class UpdateBrandStatusDto {
  @ApiProperty({
    description: '브랜드 상태',
    enum: BrandStatus,
    example: '승인됨',
  })
  @IsNotEmpty({ message: '브랜드 상태는 필수 항목입니다.' })
  @IsEnum(BrandStatus, { message: '유효하지 않은 브랜드 상태입니다.' })
  status: BrandStatus;

  // SM-006, SM-007: 반려 사유
  @ApiPropertyOptional({
    description: '반려 사유 (반려 시 필수)',
    example: '서류가 불완전합니다.',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  // SM-010: 제재 사유
  @ApiPropertyOptional({
    description: '제재 사유 (제재 시 필수)',
    example: '정책 위반으로 인한 제재',
  })
  @IsOptional()
  @IsString()
  sanctionReason?: string;
} 