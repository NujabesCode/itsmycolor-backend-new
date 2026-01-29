import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, IsDate, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { BodyType } from '../../common/types/body-type.enum';
import { ColorSeason } from '../../common/types/color-season.enum';

export enum CustomerType {
  ALL = '전체',
  CONSULTING = '컨설팅 고객',
  PURCHASE = '구매 고객',
  VIP = 'VIP 고객'
}

export class CustomerFilterDto {
  @ApiProperty({ 
    description: '고객 타입',
    enum: CustomerType,
    required: false,
    default: CustomerType.ALL
  })
  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @ApiProperty({ 
    description: '체형 타입',
    enum: BodyType,
    required: false
  })
  @IsEnum(BodyType)
  @IsOptional()
  bodyType?: BodyType;

  @ApiProperty({ 
    description: '퍼스널 컬러',
    enum: ColorSeason,
    required: false
  })
  @IsEnum(ColorSeason)
  @IsOptional()
  colorSeason?: ColorSeason;

  @ApiProperty({ 
    description: '검색어 (이름, 이메일, 전화번호)',
    required: false
  })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @ApiProperty({ 
    description: '페이지 번호', 
    required: false,
    default: 1
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ 
    description: '페이지당 항목 수', 
    required: false,
    default: 10
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class CustomerStatisticsDto {
  @ApiProperty({ description: '총 고객 수' })
  totalCustomers: number;

  @ApiProperty({ description: '컨설팅 고객 수' })
  consultingCustomers: number;

  @ApiProperty({ description: '구매 고객 수' })
  purchaseCustomers: number;

  @ApiProperty({ description: 'VIP 고객 수' })
  vipCustomers: number;
}

export class CustomerPurchaseInfoDto {
  @ApiProperty({ description: '누적 구매액' })
  totalAmount: number;

  @ApiProperty({ description: '최근 구매일', required: false })
  lastPurchaseDate?: Date | null;
}

export class CustomerResponseDto {
  @ApiProperty({ description: '고객 ID' })
  id: string;

  @ApiProperty({ description: '이름' })
  name: string;

  @ApiProperty({ description: '이메일' })
  email: string;

  @ApiProperty({ description: '전화번호', required: false })
  phone?: string;

  @ApiProperty({ description: 'VIP 여부' })
  isVip: boolean;

  @ApiProperty({ description: '체형 타입', enum: BodyType, required: false })
  bodyType?: BodyType;

  @ApiProperty({ description: '퍼스널 컬러', enum: ColorSeason, required: false })
  colorSeason?: ColorSeason;

  @ApiProperty({ description: '최근 방문일', required: false })
  lastVisitDate?: Date;

  @ApiProperty({ description: '구매 정보', required: false })
  purchaseInfo?: CustomerPurchaseInfoDto;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}

export class AdminDashboardResponseDto {
  @ApiProperty({ description: '고객 통계' })
  customerStatistics: CustomerStatisticsDto;

  @ApiProperty({ description: '총 주문 건수' })
  totalOrders: number;

  @ApiProperty({ description: '총 매출액' })
  totalSales: number;

  @ApiProperty({ description: '월별 매출 추이 (최근 6개월)' })
  monthlySales: { month: string; amount: number }[];

  @ApiProperty({ description: '체형별 타입 분석' })
  bodyTypeAnalysis: { type: string; percentage: number }[];

  @ApiProperty({ description: '인기 상품 TOP 5' })
  topProducts: { name: string; sales: number }[];

  @ApiProperty({ description: '연령대별 구매 현황' })
  ageGroupSales: { ageGroup: string; male: number; female: number }[];

  @ApiProperty({ description: '컨설팅 후 구매 전환율' })
  consultingConversion: {
    overall: number;
    colorAnalysis: number;
    bodyTypeAnalysis: number;
    styleAnalysis: number;
  };

  @ApiProperty({ description: '브랜드별 판매 성과' })
  brandPerformance: {
    brand: string;
    count: number;
    amount: number;
    growthRate: number;
    topStyles: string;
  }[];

  @ApiProperty({ description: '체형별 판매 비중' })
  bodyTypeSales: { type: string; percentage: number }[];
} 