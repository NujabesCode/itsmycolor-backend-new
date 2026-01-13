import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../products/entities/product.entity';
import { BrandLike } from './brand-like.entity';

export enum BrandStatus {
  PENDING = '심사중',
  APPROVED = '승인됨',
  REJECTED = '거부됨',
  REAPPLY = '재심사 요청', // SM-008: 재심사 요청 상태 추가
}

@Entity()
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '브랜드 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '브랜드명' })
  name: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '회사명' })
  companyName: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '브랜드 영문명', required: false })
  engName?: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '브랜드 로고 URL', required: false })
  logoUrl: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '브랜드 배경 URL', required: false })
  backgroundUrl: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '브랜드 소개', required: false })
  description: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '사업자 유형 (개인/법인)', required: false })
  businessType: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '사업자등록번호', required: false })
  businessNumber: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '대표자명', required: false })
  representativeName: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '전화번호', required: false })
  phoneNumber: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '이메일', required: false })
  email: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '주소', required: false })
  address: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '웹사이트', required: false })
  website: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'SNS', required: false })
  sns: string;

  @Column({ 
    type: 'enum', 
    enum: BrandStatus, 
    default: BrandStatus.PENDING 
  })
  @ApiProperty({ 
    description: '브랜드 상태', 
    enum: BrandStatus,
    default: BrandStatus.PENDING
  })
  status: BrandStatus;

  @Column({ nullable: true })
  @ApiProperty({ description: '문의 유형', required: false })
  inquiryType: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '카테고리', required: false })
  primaryCategory: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '서브 카테고리', required: false })
  secondaryCategory: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'SKU 개수', required: false })
  skuCount: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '판매 채널', required: false })
  salesChannels: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '타겟 고객', required: false })
  targetCustomer: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '기타 요청사항', required: false })
  etcRequest: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '브랜드 PDF URL', required: false })
  brandPdfUrl: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '신청자 ID', required: false })
  userId: string;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: '추천 컬러 정보', required: false })
  recommendedColors: Record<string, any>;

  // SM-006, SM-007: 반려 사유
  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '반려 사유', required: false })
  rejectionReason: string;

  // SM-010: 제재 사유
  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '제재 사유', required: false })
  sanctionReason: string;

  // SM-012: 변경 이력 (JSON 형태로 저장)
  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: '변경 이력', required: false })
  changeHistory: Array<{
    date: Date;
    adminName: string;
    action: string;
    reason?: string;
    status: BrandStatus;
  }>;

  @OneToMany(() => Product, (product) => product.brandEntity)
  products: Product[];

  @OneToMany(() => BrandLike, (brandLike) => brandLike.brand)
  brandLikes: BrandLike[];

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 