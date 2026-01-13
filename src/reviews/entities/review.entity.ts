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
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '리뷰 ID' })
  id: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: '리뷰 내용' })
  content: string;

  @Column({ default: 5, type: 'int' })
  @ApiProperty({ description: '별점 (1-5)' })
  rating: number;

  @Column({ nullable: true, type: 'simple-array' })
  @ApiProperty({ description: '리뷰 이미지 URL', required: false })
  imageUrls: string[];

  @Column({ nullable: true })
  @ApiProperty({ description: '사이즈 평가 (작아요/적당해요/커요)', required: false })
  sizeReview: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '색상 평가 (어두워요/적당해요/밝아요)', required: false })
  colorReview: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '두께감 평가 (얇아요/적당해요/두꺼워요)', required: false })
  thicknessReview: string;

  @Column({ default: false })
  @ApiProperty({ description: '비밀 리뷰 여부' })
  isSecret: boolean;

  @Column({ default: 0 })
  @ApiProperty({ description: '도움이 돼요 수' })
  helpfulCount: number;

  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Product, (product) => product.reviews)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;
  
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;
  
  @ManyToOne(() => OrderItem)
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