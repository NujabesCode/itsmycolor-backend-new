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
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

export enum QnaType {
  BODY = '체형문의',
  COLOR = '퍼스널컬러문의',
  PRODUCT = '상품문의',
  DELIVERY = '배송문의',
  EXCHANGE = '교환/환불문의',
  SIZE = '사이즈문의',
  FESTIVAL = '-',
}

export enum QnaStatus {
  WAITING = '답변대기',
  ANSWERED = '답변완료',
}

@Entity()
export class Qna {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '문의 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '제목' })
  title: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: '내용' })
  content: string;

  @Column({ 
    type: 'enum', 
    enum: QnaType,
    default: QnaType.PRODUCT
  })
  @ApiProperty({ 
    description: '문의 유형', 
    enum: QnaType,
    default: QnaType.PRODUCT
  })
  type: QnaType;

  @Column({ 
    type: 'enum', 
    enum: QnaStatus,
    default: QnaStatus.WAITING
  })
  @ApiProperty({ 
    description: '문의 상태', 
    enum: QnaStatus,
    default: QnaStatus.WAITING
  })
  status: QnaStatus;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '답변', required: false })
  answer: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '답변일', required: false })
  answeredAt: Date;

  @Column({ nullable: true })
  @ApiProperty({ description: '답변자 ID', required: false })
  answeredBy: string;

  @Column({ default: false })
  @ApiProperty({ description: '비밀글 여부' })
  isPrivate: boolean;

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ description: '첨부 이미지 URL', required: false, type: [String] })
  imageUrls: string[];

  @ManyToOne(() => User, (user) => user.qnas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Product, (product) => product.qnas, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  productId: string;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 