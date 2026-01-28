import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { BodyType } from '../../common/types/body-type.enum';
import { ColorSeason } from '../../common/types/color-season.enum';
import { Gender } from '../../common/types/gender.enum';
import { MajorCategory } from '../../common/types/major-category.enum';

export class ProductResponseDto {
  @ApiProperty({ description: '상품 ID' })
  id: string;

  @ApiProperty({ description: '상품명' })
  name: string;

  @ApiProperty({ description: '가격' })
  price: number;

  @ApiProperty({ description: '달러 가격' })
  usdPrice: number;

  @ApiProperty({ description: '할인 전 원화 가격', required: false })
  originalPriceKr?: number;

  @ApiProperty({ description: '할인 전 달러 가격', required: false })
  originalPriceUsd?: number;

  @ApiProperty({ description: '재고 수량' })
  stockQuantity: number;

  @ApiProperty({ description: '상품 이미지 URL', required: false })
  imageUrl: string | null;

  @ApiProperty({
    description: '추천 퍼스널 컬러',
    enum: ColorSeason,
    isArray: true,
  })
  recommendedColorSeason: ColorSeason[];

  @ApiProperty({ description: '추천 체형', enum: BodyType })
  recommendedBodyType: BodyType;

  @ApiProperty({ description: '추천 성별', enum: Gender, required: false })
  recommendedGender?: Gender;

  @ApiProperty({ description: '추천 카테고리', required: false })
  recommendedCategory?: string;

  @ApiProperty({ description: '형태별 대분류 카테고리', enum: MajorCategory, required: false })
  majorCategory?: MajorCategory;

  @ApiProperty({ description: '브랜드' })
  brand: string;

  @ApiProperty({ description: '상품 사용 가능 여부' })
  isAvailable: boolean;

  @ApiProperty({ description: '브랜드 정보', required: false })
  brandInfo?: {
    id: string;
    name: string;
    logoUrl?: string;
  };

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '찜 수', required: false, default: 0 })
  likesCount?: number;

  @ApiProperty({ description: '리뷰 수', required: false, default: 0 })
  reviewCount?: number;

  @ApiProperty({ description: '평균 별점(1~5)', required: false, default: null })
  ratingAvg?: number | null;

  constructor(product: Product, extras?: { likesCount?: number; reviewCount?: number; ratingAvg?: number | null }) {
    this.id = product.id;
    this.name = product.name;
    this.price = product.price;
    this.usdPrice = product.usdPrice;
    this.originalPriceKr = product.originalPriceKr ?? undefined;
    this.originalPriceUsd = product.originalPriceUsd ?? undefined;
    this.stockQuantity = product.stockQuantity;
    // localhost로 시작하는 이미지 URL은 프로덕션에서 사용할 수 없으므로 null로 변환
    if (product.imageUrl && (product.imageUrl.startsWith('http://localhost') || product.imageUrl.startsWith('https://localhost'))) {
      this.imageUrl = null;
    } else {
      this.imageUrl = product.imageUrl || null;
    }
    this.recommendedColorSeason = product.recommendedColorSeason;
    this.recommendedBodyType = product.recommendedBodyType;
    this.recommendedGender = product.recommendedGender;
    this.recommendedCategory = product.recommendedCategory;
    this.majorCategory = product.majorCategory;
    this.brand = product.brand;
    this.createdAt = product.createdAt;
    this.isAvailable = product.isAvailable;

    // 브랜드 정보가 있는 경우
    if (product.brandEntity) {
      this.brandInfo = {
        id: product.brandEntity.id,
        name: product.brandEntity.name,
        logoUrl: product.brandEntity.logoUrl,
      };
    }

    if (extras) {
      this.likesCount = extras.likesCount ?? 0;
      this.reviewCount = extras.reviewCount ?? 0;
      this.ratingAvg = extras.ratingAvg ?? null;
    }
  }
}
