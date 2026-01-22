import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { ColorAnalysis } from '../../color-analysis/entities/color-analysis.entity';
import { Order } from '../../orders/entities/order.entity';
import { Qna } from '../../qna/entities/qna.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Exclude } from 'class-transformer';
import { ProductLike } from '../../products/entities/product-like.entity';
import { BrandLike } from '../../brands/entities/brand-like.entity';
import { Address } from '../../addresses/entities/address.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';

export enum UserRole {
  USER = '일반 고객',
  CONSULTANT = '컨설턴트',
  BRAND_ADMIN = '브랜드 관리자',
  SYSTEM_ADMIN = '시스템 관리자',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @Column({ unique: true })
  @ApiProperty({ description: '이메일' })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  @ApiProperty({ description: '비밀번호' })
  password: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '이름' })
  name: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '전화번호' })
  phone: string;

  @Column({ default: false })
  @ApiProperty({ description: '이메일 인증 여부' })
  isVerified: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  @ApiProperty({
    description: '사용자 권한',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: true })
  @ApiProperty({ description: '활성화 여부' })
  isActive: boolean;

  @Column({ default: 0 })
  @ApiProperty({ description: '로그인 실패 횟수' })
  loginFailureCount: number;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: '계정 잠금 시간' })
  lockedUntil: Date | null;

  @Column({ nullable: true })
  @ApiProperty({ description: '마지막 로그인 토큰 ID (다중 로그인 방지용)' })
  lastTokenId: string;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  @OneToMany(() => ColorAnalysis, (colorAnalysis) => colorAnalysis.user)
  colorAnalyses: ColorAnalysis[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Qna, (qna) => qna.user)
  qnas: Qna[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => ProductLike, (productLike) => productLike.user)
  productLikes: ProductLike[];

  @OneToMany(() => BrandLike, (brandLike) => brandLike.user)
  brandLikes: BrandLike[];

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @OneToMany(() => Coupon, (coupon) => coupon.user)
  coupons: Coupon[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // 비밀번호가 변경된 경우에만 해시화
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    // 이메일을 소문자로 정규화 (일관성 유지)
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
