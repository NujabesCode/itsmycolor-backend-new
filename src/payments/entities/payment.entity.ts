import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '결제 ID' })
  id: string;

  @Column()
  orderId: string;

  @OneToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  @ApiProperty({ description: '주문 정보' })
  order: Order;

  @Column()
  @ApiProperty({ description: '결제 키' })
  paymentKey: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '가상계좌' })
  virtualAccount: string;

  @Column()
  @ApiProperty({ description: '결제 상태' })
  isPaid: boolean;

  @Column({ default: false })
  @ApiProperty({ description: '취소 여부' })
  isCanceled: boolean;

  @Column()
  @ApiProperty({ description: '결제 금액' })
  paidAmount: number;

  @Column({ default: 0 })
  @ApiProperty({ description: '취소 금액' })
  cancelAmount: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '취소 이유' })
  cancelReason: string;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}
