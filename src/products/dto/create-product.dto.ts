import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
  ValidateNested,
  IsObject,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BodyType } from '../../common/types/body-type.enum';
import { ColorSeason } from '../../common/types/color-season.enum';
import { StyleCategory } from '../../common/types/style-category.enum';
import { Gender } from '../../common/types/gender.enum';
import { MajorCategory } from '../../common/types/major-category.enum';
import { ClothingCategory } from '../../common/types/clothing-category.enum';

export class SizeInfoDto {
  @ApiProperty({ description: '사이즈 정보 (소)', required: false })
  @IsString()
  @IsOptional()
  S?: string;

  @ApiProperty({ description: '사이즈 정보 (중)', required: false })
  @IsString()
  @IsOptional()
  M?: string;

  @ApiProperty({ description: '사이즈 정보 (대)', required: false })
  @IsString()
  @IsOptional()
  L?: string;

  @ApiProperty({ description: '사이즈 정보 (FREE)', required: false })
  @IsString()
  @IsOptional()
  FREE?: string;
}

export class RefundInfoDto {
  @ApiProperty({ description: '교환/반품 배송비', required: false })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  shippingFee?: number;

  @ApiProperty({ description: '교환/반품 주소', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: '교환/반품 안내', required: false })
  @IsString()
  @IsOptional()
  guide?: string;

  @ApiProperty({ description: '교환/반품 불가 사유 1', required: false })
  @IsString()
  @IsOptional()
  returnReason1?: string;

  @ApiProperty({ description: '교환/반품 불가 사유 2', required: false })
  @IsString()
  @IsOptional()
  returnReason2?: string;
}

export class BodyInfoDto {
  @ApiProperty({ description: '키(cm)', required: false })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  height?: number;

  @ApiProperty({ description: '몸무게(kg)', required: false })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  weight?: number;
}

export class CreateProductDto {
  @ApiProperty({ description: '상품명' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '브랜드 ID', required: true })
  @IsUUID()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({ description: '브랜드명', required: false })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ description: '가격' })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  price: number;

  @ApiProperty({ description: 'USD 가격' })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  usdPrice: number;

  @ApiProperty({ description: '할인 전 원화 가격', required: false })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  originalPriceKr?: number;

  @ApiProperty({ description: '할인 전 달러 가격', required: false })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : undefined))
  originalPriceUsd?: number;

  @ApiProperty({ description: '상품 상세', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '재고수량', default: 0 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  stockQuantity?: number;

  @ApiProperty({ description: '판매 여부', default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isAvailable?: boolean;

  @ApiProperty({
    description: '추천 퍼스널 컬러',
    enum: ColorSeason,
    required: false,
    isArray: true,
  })
  @IsEnum(ColorSeason, { each: true })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  recommendedColorSeason?: ColorSeason[];

  @ApiProperty({ description: '추천 체형', enum: BodyType, required: false })
  @IsEnum(BodyType)
  @IsOptional()
  recommendedBodyType?: BodyType;

  @ApiProperty({ description: '추천 성별', enum: Gender })
  @IsEnum(Gender)
  recommendedGender: Gender;

  @ApiProperty({ description: '추천 카테고리(1택)' })
  @IsString()
  recommendedCategory: string;

  @ApiProperty({ description: '형태별 대분류 카테고리', enum: MajorCategory, required: false })
  @IsEnum(MajorCategory)
  @IsOptional()
  majorCategory?: MajorCategory;

  @ApiProperty({ description: '의류 카테고리', enum: ClothingCategory, required: false })
  @IsEnum(ClothingCategory)
  @IsOptional()
  clothingCategory?: ClothingCategory;

  @ApiProperty({
    description: '스타일 카테고리',
    enum: StyleCategory,
    required: false,
    isArray: true,
  })
  @IsEnum(StyleCategory, { each: true })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  styleCategories?: StyleCategory[];

  @ApiProperty({ description: '사이즈 옵션', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  sizeOptions?: string[];

  @ApiProperty({ description: '색상 옵션', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  colorOptions?: string[];

  @ApiProperty({
    description: '사이즈 정보',
    type: SizeInfoDto,
    required: false,
  })
  @IsObject()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @Type(() => SizeInfoDto)
  sizeInfo?: SizeInfoDto;

  @ApiProperty({ description: '소재', required: false })
  @IsString()
  @IsOptional()
  material?: string;

  @ApiProperty({ description: '모델 정보', required: false })
  @IsString()
  @IsOptional()
  modelInfo?: string;

  @ApiProperty({ description: '체형 정보', type: BodyInfoDto, required: false })
  @IsObject()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @Type(() => BodyInfoDto)
  bodyInfo?: BodyInfoDto;

  @ApiProperty({ description: '판매 시작일', required: false })
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'string' || !value) return undefined;
    try {
      return new Date(value).toISOString();
    } catch (e) {
      return undefined;
    }
  })
  saleStartDate?: string;

  @ApiProperty({ description: '판매 종료일', required: false })
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'string' || !value) return undefined;
    try {
      return new Date(value).toISOString();
    } catch (e) {
      return undefined;
    }
  })
  saleEndDate?: string;

  @ApiProperty({
    description: '판매 종료 설정',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasSaleEndDate?: boolean;

  @ApiProperty({ description: '배송비', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  shippingFee?: number;

  @ApiProperty({ description: '무료 배송 기준 금액', required: false })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  freeShippingAmount?: number;

  @ApiProperty({
    description: '환불/교환 정보',
    type: RefundInfoDto,
    required: false,
  })
  @IsObject()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @Type(() => RefundInfoDto)
  refundInfo?: RefundInfoDto;
}
