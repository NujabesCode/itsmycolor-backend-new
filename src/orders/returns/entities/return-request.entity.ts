import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/entities/user.entity';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';

export enum ReturnStatus {
  REQUESTED = '반품신청',
  REVIEWING = '검토중',
  APPROVED = '승인',
  SHIPPING = '반품배송중',
  COMPLETED = '반품완료',
  REJECTED = '거부',
}

export enum ReturnReason {
  SIZE = '사이즈 문제',
  COLOR = '색상 문제',
  DAMAGED = '상품 불량',
  DIFFERENT = '상품 상이',
  LOST_INTEREST = '단순 변심',
  OTHER = '기타',
}

@Entity()
export class ReturnRequest {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '반품 요청 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '반품 요청 번호' })
  returnNumber: string;

  @Column({
    type: 'enum',
    enum: ReturnStatus,
    default: ReturnStatus.REQUESTED,
  })
  @ApiProperty({
    description: '반품 상태',
    enum: ReturnStatus,
    default: ReturnStatus.REQUESTED,
  })
  status: ReturnStatus;

  @Column({
    type: 'enum',
    enum: ReturnReason,
    default: ReturnReason.OTHER,
  })
  @ApiProperty({
    description: '반품 사유',
    enum: ReturnReason,
    default: ReturnReason.OTHER,
  })
  reason: ReturnReason;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '상세 사유', required: false })
  detailReason: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '반품 승인 일시', required: false })
  approvedAt: Date;

  @Column({ nullable: true })
  @ApiProperty({ description: '반품 완료 일시', required: false })
  completedAt: Date;

  @Column({ nullable: true })
  @ApiProperty({ description: '반품 거부 일시', required: false })
  rejectedAt: Date;

  @Column({ nullable: true })
  @ApiProperty({ description: '반품 거부 사유', required: false })
  rejectReason: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '반품 운송장 번호', required: false })
  returnTrackingNumber: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '환불 계좌 은행', required: false })
  refundBank: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '환불 계좌 번호', required: false })
  refundAccountNumber: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '환불 예금주', required: false })
  refundAccountHolder: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '환불 금액', required: false })
  refundAmount: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '환불 완료 일시', required: false })
  refundedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => OrderItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;

  @Column()
  orderItemId: string;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 