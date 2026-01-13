import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum, IsObject } from 'class-validator';
import { BrandStatus } from '../entities/brand.entity';
import { Transform } from 'class-transformer';

export class CreateBrandDto {
  @ApiProperty({ description: '브랜드명' })
  @IsString()
  name: string;

  @ApiProperty({ description: '회사명' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ description: '브랜드 영문명', required: false })
  @IsString()
  @IsOptional()
  engName?: string;

  @ApiProperty({ description: '브랜드 소개', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '사업자 유형 (개인/법인)', required: false })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiProperty({ description: '사업자등록번호', required: false })
  @IsString()
  @IsOptional()
  businessNumber?: string;

  @ApiProperty({ description: '대표자명', required: false })
  @IsString()
  @IsOptional()
  representativeName?: string;

  @ApiProperty({ description: '전화번호', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ description: '이메일', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: '주소', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: '웹사이트', required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: 'SNS', required: false })
  @IsString()
  @IsOptional()
  sns?: string;

  @ApiProperty({ description: '상태', enum: BrandStatus, required: false, default: BrandStatus.PENDING })
  @IsEnum(BrandStatus)
  @IsOptional()
  status?: BrandStatus;

  @ApiProperty({ description: '추천 컬러 정보', required: false })
  @IsObject({ message: 'recommendedColors는 객체 형식이어야 합니다.' })
  @IsOptional()
  @Transform(({ value }) => {
    // 값이 이미 객체인 경우 그대로 반환
    if (value && typeof value === 'object') {
      return value;
    }
    
    // 문자열인 경우 JSON 파싱
    if (value && typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return {}; // 파싱 실패 시 빈 객체 반환
      }
    }
    
    // 그 외의 경우 빈 객체 반환
    return {};
  })
  recommendedColors?: Record<string, any>;

  @ApiProperty({ description: '문의 유형', required: false })
  @IsString()
  @IsOptional()
  inquiryType?: string;
  
  @ApiProperty({ description: '카테고리', required: false })
  @IsString()
  @IsOptional()
  primaryCategory?: string;

  @ApiProperty({ description: '서브 카테고리', required: false })
  @IsString()
  @IsOptional()
  secondaryCategory?: string;

  @ApiProperty({ description: 'SKU 개수', required: false })
  @Transform(({ value }) => {
    if (value && typeof value === 'string') {
      return parseInt(value);
    }
    return value;
  })
  @IsOptional()
  skuCount?: number;

  @ApiProperty({ description: '판매 채널', required: false })
  @IsString()
  @IsOptional()
  salesChannels?: string;

  @ApiProperty({ description: '타겟 고객', required: false })
  @IsString()
  @IsOptional()
  targetCustomer?: string;

  @ApiProperty({ description: '기타 요청사항', required: false })
  @IsString()
  @IsOptional()
  etcRequest?: string;
} 