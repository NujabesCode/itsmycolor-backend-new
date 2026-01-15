import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ColorSeason } from '../../common/types/color-season.enum';
import { BodyType } from '../../common/types/body-type.enum';
import { StyleCategory } from '../../common/types/style-category.enum';
import { Review } from '../../reviews/entities/review.entity';
import { Qna } from '../../qna/entities/qna.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { ProductLike } from './product-like.entity';
import { Gender } from '../../common/types/gender.enum';
import { MajorCategory } from '../../common/types/major-category.enum';
import { ClothingCategory } from '../../common/types/clothing-category.enum';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '상품 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '상품명' })
  name: string;

  @Column()
  @ApiProperty({ description: '가격' })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({ description: 'USD 가격' })
  usdPrice: number;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '상품 상세', required: false })
  description: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '상품 이미지 URL', required: false })
  imageUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ description: '상품 추가 이미지 URL 목록', required: false })
  additionalImageUrls: string[];

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({
    description: '추천 퍼스널 컬러',
    enum: ColorSeason,
    isArray: true,
    required: false,
  })
  recommendedColorSeason: ColorSeason[];

  @Column({
    type: 'enum',
    enum: BodyType,
    nullable: true,
  })
  @ApiProperty({
    description: '추천 체형',
    enum: BodyType,
    required: false,
  })
  recommendedBodyType: BodyType;

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({
    description: '스타일 카테고리',
    enum: StyleCategory,
    isArray: true,
    required: false,
  })
  styleCategories: string[];

  @Column({ default: 0 })
  @ApiProperty({ description: '재고수량' })
  stockQuantity: number;

  @Column({ default: false })
  @ApiProperty({ description: '판매 여부' })
  isAvailable: boolean;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  @ApiProperty({ description: '추천 성별', required: false })
  recommendedGender: Gender;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @ApiProperty({ description: '추천 카테고리(1택)', required: false })
  recommendedCategory: string;

  @Column({ type: 'enum', enum: MajorCategory, nullable: true })
  @ApiProperty({ description: '형태별 대분류 카테고리', enum: MajorCategory, required: false })
  majorCategory?: MajorCategory;

  @Column({ type: 'enum', enum: ClothingCategory, nullable: true })
  @ApiProperty({ description: '의류 카테고리', enum: ClothingCategory, required: false })
  clothingCategory?: ClothingCategory;

  @Column({ default: false })
  @ApiProperty({ description: '삭제 여부' })
  isDeleted: boolean;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: '사이즈 정보', required: false })
  sizeInfo: Record<string, any>;

  @Column({ nullable: true })
  @ApiProperty({ description: '브랜드', required: false })
  brand: string;

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ description: '색상 옵션', required: false })
  colorOptions: string[];

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ description: '사이즈 옵션', required: false })
  sizeOptions: string[];

  @Column({ nullable: true })
  @ApiProperty({ description: '모델 정보', required: false })
  modelInfo: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '소재', required: false })
  material: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '판매 시작일', required: false })
  saleStartDate: Date;

  @Column({ nullable: true })
  @ApiProperty({ description: '판매 종료일', required: false })
  saleEndDate: Date;

  @Column({ default: false })
  @ApiProperty({ description: '판매 종료 설정', required: false })
  hasSaleEndDate: boolean;

  @Column({ default: 0 })
  @ApiProperty({ description: '배송비' })
  shippingFee: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '무료 배송 기준 금액', required: false })
  freeShippingAmount: number;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: '환불/교환 정보', required: false })
  refundInfo: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: '체형 정보', required: false })
  bodyInfo: Record<string, any>;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brandId' })
  brandEntity: Brand;

  @Column({ nullable: true })
  brandId: string;

  @Column({ default: 0 })
  @ApiProperty({ description: '판매 수량' })
  salesCount: number;

  @Column({ type: 'int', nullable: true })
  @ApiProperty({ description: '할인 전 원화 가격', required: false })
  originalPriceKr?: number;

  @Column({ type: 'int', nullable: true })
  @ApiProperty({ description: '할인 전 달러 가격', required: false })
  originalPriceUsd?: number;

  @Column({ default: 0 })
  @ApiProperty({ description: '조회수' })
  viewCount: number;

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToMany(() => Qna, (qna) => qna.product)
  qnas: Qna[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => ProductLike, (productLike) => productLike.product)
  productLikes: ProductLike[];

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  // PD-011: 상품 반려 사유
  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '반려 사유', required: false })
  rejectionReason: string;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}
