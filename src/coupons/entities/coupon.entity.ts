import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum CouponType {
  PERCENT = 'per',
  FIXED = 'fix',
}

@Entity()
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '쿠폰 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ManyToOne(() => User, (user) => user.coupons, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  @ApiProperty({ description: '쿠폰 이름' })
  name: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '쿠폰 설명', required: false })
  description?: string;

  @Column({
    type: 'enum',
    enum: CouponType,
  })
  @ApiProperty({ description: '쿠폰 유형', enum: CouponType })
  type: CouponType;

  @Column()
  @ApiProperty({ description: '쿠폰 값(%) 또는 금액' })
  value: number;

  @Column()
  @ApiProperty({ description: '만료 일자', type: 'string', format: 'date-time' })
  expiredAt: Date;

  @Column({ default: 0 })
  @ApiProperty({ description: '최소 주문 금액' })
  minPrice: number;

  @Column({ default: false })
  @ApiProperty({ description: '사용 여부' })
  isUsed: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}
