import { ApiProperty } from '@nestjs/swagger';
import { BrandStatus } from '../entities/brand.entity';

export class BrandResponseDto {
  @ApiProperty({ description: '브랜드 ID' })
  id: string;

  @ApiProperty({ description: '브랜드명' })
  name: string;

  @ApiProperty({ description: '회사명', required: false })
  companyName?: string;

  @ApiProperty({ description: '브랜드 영문명', required: false })
  engName: string;

  @ApiProperty({ description: '브랜드 로고 URL', required: false })
  logoUrl: string;

  @ApiProperty({ description: '브랜드 배경 URL', required: false })
  backgroundUrl: string;

  @ApiProperty({ description: '브랜드 소개', required: false })
  description: string;

  @ApiProperty({ description: '사업자 유형 (개인/법인)', required: false })
  businessType: string;

  @ApiProperty({ description: '대표자명', required: false })
  representativeName: string;

  @ApiProperty({ description: '전화번호', required: false })
  phoneNumber: string;

  @ApiProperty({ description: '이메일', required: false })
  email: string;

  @ApiProperty({ description: '주소', required: false })
  address: string;

  @ApiProperty({ description: '웹사이트', required: false })
  website: string;

  @ApiProperty({ description: 'SNS', required: false })
  sns: string;

  @ApiProperty({ description: '상태', enum: BrandStatus })
  status: BrandStatus;

  @ApiProperty({ description: '추천 컬러 정보', required: false })
  recommendedColors: Record<string, any>;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  @ApiProperty({ description: '신청자 ID', required: false })
  userId?: string;

  @ApiProperty({ description: '문의 유형', required: false })
  inquiryType?: string;

  @ApiProperty({ description: '카테고리', required: false })
  primaryCategory?: string;

  @ApiProperty({ description: '서브 카테고리', required: false })
  secondaryCategory?: string;

  @ApiProperty({ description: 'SKU 개수', required: false })
  skuCount?: number;

  @ApiProperty({ description: '판매 채널', required: false })
  salesChannels?: string;

  @ApiProperty({ description: '타겟 고객', required: false })
  targetCustomer?: string;

  @ApiProperty({ description: '기타 요청사항', required: false })
  etcRequest?: string;

  @ApiProperty({ description: '브랜드 PDF URL', required: false })
  brandPdfUrl?: string;

  @ApiProperty({ description: '반려 사유', required: false })
  rejectionReason?: string;

  @ApiProperty({ description: '제재 사유', required: false })
  sanctionReason?: string;

  @ApiProperty({ description: '변경 이력', required: false })
  changeHistory?: Array<{
    date: Date;
    adminName: string;
    action: string;
    reason?: string;
    status: any;
  }>;

  constructor(partial: Partial<BrandResponseDto>) {
    Object.assign(this, partial);
  }
} 