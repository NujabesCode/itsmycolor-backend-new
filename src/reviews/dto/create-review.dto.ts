import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';

enum SizeReview {
  SMALL = '작아요',
  MEDIUM = '적당해요',
  LARGE = '커요',
}

enum ColorReview {
  DARK = '어두워요',
  MEDIUM = '적당해요',
  BRIGHT = '밝아요',
}

enum ThicknessReview {
  THIN = '얇아요',
  MEDIUM = '적당해요',
  THICK = '두꺼워요',
}

export class CreateReviewDto {
  @ApiProperty({ description: '상품 ID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: '주문 ID' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: '주문 상품 ID' })
  @IsUUID()
  @IsNotEmpty()
  orderItemId: string;

  @ApiProperty({ description: '리뷰 내용' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '평점 (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @Transform(({ value }) => parseInt(value, 10))
  rating: number;

  @ApiProperty({ description: '사이즈 평가', enum: SizeReview, required: false })
  @IsOptional()
  @IsEnum(SizeReview)
  sizeReview?: SizeReview;

  @ApiProperty({ description: '색상 평가', enum: ColorReview, required: false })
  @IsOptional()
  @IsEnum(ColorReview)
  colorReview?: ColorReview;

  @ApiProperty({ description: '두께감 평가', enum: ThicknessReview, required: false })
  @IsOptional()
  @IsEnum(ThicknessReview)
  thicknessReview?: ThicknessReview;

  @ApiProperty({ description: '비밀 리뷰 여부', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;
} 