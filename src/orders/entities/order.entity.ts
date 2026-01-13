import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum OrderStatus {
  PENDING = '주문 접수',
  CONFIRMED = '결제 완료',
  SHIPPED = '배송 준비',
  DELIVERING = '배송 중',
  DELIVERED = '배송 완료',
  CANCELLED = '주문 취소',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '주문 ID' })
  id: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @ApiProperty({
    description: '주문 상태',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ default: 'KRW' })
  @ApiProperty({ description: '통화', default: 'KRW' })
  currency: string;

  @Column()
  @ApiProperty({ description: '상품 총액' })
  productAmount: number;

  @Column({ default: 0 })
  @ApiProperty({ description: '할인 금액' })
  discountAmount: number;

  @Column({ default: 0 })
  @ApiProperty({ description: '배송비' })
  shippingFee: number;

  @Column()
  @ApiProperty({ description: '총 결제 금액' })
  totalAmount: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '우편번호', required: false })
  zipCode: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '배송지 주소', required: false })
  shippingAddress: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '상세 주소', required: false })
  detailAddress: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '받는 사람', required: false })
  recipientName: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '받는 사람 연락처', required: false })
  recipientPhone: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '직접 입력 배송 요청사항', required: false })
  customDeliveryRequest: string;
  
  // 배송 택배사
  @Column({ nullable: true })
  @ApiProperty({ description: '배송 택배사', required: false })
  deliveryCompany: string;

  // 배송 송장번호
  @Column({ nullable: true })
  @ApiProperty({ description: '배송 송장번호', required: false })
  deliveryTrackingNumber: string;

  @Column({ default: false })
  @ApiProperty({ description: '정산 완료 여부' })
  isSettled: boolean;

  @Column({ default: false })
  @ApiProperty({ description: '개인정보 수집 및 이용 동의' })
  privacyAgreement: boolean;

  @Column({ default: false })
  @ApiProperty({ description: '구매조건 확인 및 결제 진행 동의' })
  purchaseAgreement: boolean;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  orderItems: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  @ApiProperty({ description: '결제 정보', required: false })
  payment: Payment;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}
