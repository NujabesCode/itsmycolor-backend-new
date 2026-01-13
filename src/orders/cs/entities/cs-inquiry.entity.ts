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

export enum InquiryStatus {
  PENDING = '답변대기',
  COMPLETED = '답변완료',
}

export enum InquiryType {
  ORDER = '주문문의',
  DELIVERY = '배송문의',
  PRODUCT = '상품문의',
  EXCHANGE = '교환문의',
  RETURN = '반품문의',
  OTHER = '기타문의',
}

@Entity()
export class CSInquiry {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '문의 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '문의 번호' })
  inquiryNumber: string;
  
  @Column({
    type: 'enum',
    enum: InquiryType,
    default: InquiryType.OTHER,
  })
  @ApiProperty({
    description: '문의 유형',
    enum: InquiryType,
    default: InquiryType.OTHER,
  })
  type: InquiryType;

  @Column()
  @ApiProperty({ description: '문의 제목' })
  title: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: '문의 내용' })
  content: string;

  @Column({
    type: 'enum',
    enum: InquiryStatus,
    default: InquiryStatus.PENDING,
  })
  @ApiProperty({
    description: '문의 상태',
    enum: InquiryStatus,
    default: InquiryStatus.PENDING,
  })
  status: InquiryStatus;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '답변 내용', required: false })
  answer: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '답변 일시', required: false })
  answeredAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ nullable: true })
  orderId: string;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 