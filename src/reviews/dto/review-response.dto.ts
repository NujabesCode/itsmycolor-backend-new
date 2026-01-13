import { ApiProperty } from '@nestjs/swagger';
import { Review } from '../entities/review.entity';

export class ReviewUserDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '사용자 이름' })
  name: string;
}

export class ReviewResponseDto {
  @ApiProperty({ description: '리뷰 ID' })
  id: string;

  @ApiProperty({ description: '리뷰 내용' })
  content: string;

  @ApiProperty({ description: '별점 (1-5)' })
  rating: number;

  @ApiProperty({ description: '리뷰 이미지 URL 목록', type: [String], required: false })
  imageUrls: string[];

  @ApiProperty({ description: '사이즈 평가' })
  sizeReview: string;

  @ApiProperty({ description: '색상 평가' })
  colorReview: string;

  @ApiProperty({ description: '두께감 평가' })
  thicknessReview: string;

  @ApiProperty({ description: '비밀 리뷰 여부' })
  isSecret: boolean;

  @ApiProperty({ description: '도움이 돼요 수' })
  helpfulCount: number;

  @ApiProperty({ description: '작성자 정보', type: ReviewUserDto })
  user: ReviewUserDto;

  @ApiProperty({ description: '상품 ID' })
  productId: string;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  constructor(review: Review) {
    this.id = review.id;
    this.content = review.content;
    this.rating = review.rating;
    this.imageUrls = review.imageUrls || [];
    this.sizeReview = review.sizeReview;
    this.colorReview = review.colorReview;
    this.thicknessReview = review.thicknessReview;
    this.isSecret = review.isSecret;
    this.helpfulCount = review.helpfulCount;
    this.productId = review.productId;
    this.createdAt = review.createdAt;
    this.updatedAt = review.updatedAt;
    
    if (review.user) {
      this.user = {
        id: review.user.id,
        name: review.user.name,
      };
    }
  }
} 