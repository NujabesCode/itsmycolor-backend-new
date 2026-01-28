import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { BodyType } from '../../common/types/body-type.enum';
import { ColorSeason } from '../../common/types/color-season.enum';
import { StyleCategory } from '../../common/types/style-category.enum';
import { Gender } from '../../common/types/gender.enum';

export class ProductDetailResponseDto {
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

  @ApiProperty({ description: '상품 상세', required: false })
  description?: string;

  @ApiProperty({ description: '상품 이미지 URL', required: false })
  imageUrl?: string;

  @ApiProperty({ description: '상품 추가 이미지 URL 목록', required: false })
  additionalImageUrls?: string[];

  @ApiProperty({ description: '추천 퍼스널 컬러', enum: ColorSeason, isArray: true, required: false })
  recommendedColorSeason?: ColorSeason[];

  @ApiProperty({ description: '추천 체형', enum: BodyType, required: false })
  recommendedBodyType?: BodyType;

  @ApiProperty({ description: '추천 성별', enum: Gender, required: false })
  recommendedGender?: Gender;

  @ApiProperty({ description: '추천 카테고리', required: false })
  recommendedCategory?: string;

  @ApiProperty({ description: '스타일 카테고리', enum: StyleCategory, isArray: true, required: false })
  styleCategories?: string[];

  @ApiProperty({ description: '재고수량' })
  stockQuantity: number;

  @ApiProperty({ description: '판매 여부' })
  isAvailable: boolean;

  @ApiProperty({
    description: '사이즈 정보',
    additionalProperties: {
      type: 'string'
    }
  })
  sizeInfo?: Record<string, string>;

  @ApiProperty({ description: '브랜드', required: false })
  brand?: string;

  @ApiProperty({ description: '색상 옵션', required: false })
  colorOptions?: string[];

  @ApiProperty({ description: '사이즈 옵션', required: false })
  sizeOptions?: string[];

  @ApiProperty({ description: '모델 정보', required: false })
  modelInfo?: string;

  @ApiProperty({ description: '소재', required: false })
  material?: string;

  @ApiProperty({ description: '판매 시작일', required: false })
  saleStartDate?: Date;

  @ApiProperty({ description: '판매 종료일', required: false })
  saleEndDate?: Date;

  @ApiProperty({ description: '판매 종료 설정', required: false })
  hasSaleEndDate?: boolean;

  @ApiProperty({ description: '배송비' })
  shippingFee: number;

  @ApiProperty({ description: '무료 배송 기준 금액', required: false })
  freeShippingAmount?: number;

  @ApiProperty({ description: '환불/교환 정보', required: false })
  refundInfo?: Record<string, any>;

  @ApiProperty({ description: '체형 정보', required: false })
  bodyInfo?: Record<string, any>;

  @ApiProperty({ description: '리뷰 수', required: false })
  reviewCount?: number;

  @ApiProperty({ description: '평균 평점', required: false })
  averageRating?: number;

  @ApiProperty({ description: '브랜드 정보', required: false })
  brandInfo?: {
    id: string;
    name: string;
    logoUrl?: string;
  };

  @ApiProperty({ description: '조회수' })
  viewCount: number;

  @ApiProperty({ description: '판매 수량' })
  salesCount: number;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  @ApiProperty({ description: '삭제 여부' })
  isDeleted: boolean;

  constructor(product: Product) {
    this.id = product.id;
    this.name = product.name;
    this.price = product.price;
    this.usdPrice = product.usdPrice;
    this.originalPriceKr = product.originalPriceKr ?? undefined;
    this.originalPriceUsd = product.originalPriceUsd ?? undefined;
    this.description = product.description;
    // localhost로 시작하는 이미지 URL은 프로덕션에서 사용할 수 없으므로 null로 변환
    if (product.imageUrl && (product.imageUrl.startsWith('http://localhost') || product.imageUrl.startsWith('https://localhost'))) {
      this.imageUrl = undefined;
    } else {
      this.imageUrl = product.imageUrl;
    }
    // additionalImageUrls도 필터링
    if (product.additionalImageUrls && product.additionalImageUrls.length > 0) {
      this.additionalImageUrls = product.additionalImageUrls.filter(url => 
        !url.startsWith('http://localhost') && !url.startsWith('https://localhost')
      );
      if (this.additionalImageUrls.length === 0) {
        this.additionalImageUrls = undefined;
      }
    } else {
      this.additionalImageUrls = product.additionalImageUrls;
    }
    this.recommendedColorSeason = product.recommendedColorSeason;
    this.recommendedBodyType = product.recommendedBodyType;
    this.recommendedGender = product.recommendedGender;
    this.recommendedCategory = product.recommendedCategory;
    this.styleCategories = product.styleCategories;
    this.stockQuantity = product.stockQuantity;
    this.isAvailable = product.isAvailable;
    this.sizeInfo = product.sizeInfo;
    this.brand = product.brand;
    this.colorOptions = product.colorOptions;
    this.sizeOptions = product.sizeOptions;
    this.modelInfo = product.modelInfo;
    this.material = product.material;
    this.saleStartDate = product.saleStartDate;
    this.saleEndDate = product.saleEndDate;
    this.hasSaleEndDate = product.hasSaleEndDate;
    this.shippingFee = product.shippingFee;
    this.freeShippingAmount = product.freeShippingAmount;
    this.refundInfo = product.refundInfo;
    this.bodyInfo = product.bodyInfo;
    this.viewCount = product.viewCount;
    this.salesCount = product.salesCount;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
    this.isDeleted = product.isDeleted;
    // 브랜드 정보가 있는 경우
    if (product.brandEntity) {
      this.brandInfo = {
        id: product.brandEntity.id,
        name: product.brandEntity.name,
        logoUrl: product.brandEntity.logoUrl,
      };
    }
    
    // 리뷰 정보가 있는 경우
    if (product.reviews && product.reviews.length > 0) {
      this.reviewCount = product.reviews.length;
      this.averageRating = product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length;
    } else {
      this.reviewCount = 0;
      this.averageRating = 0;
    }
  }
} 