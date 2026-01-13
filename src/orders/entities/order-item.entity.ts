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
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '주문 아이템 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '수량' })
  quantity: number;

  @Column()
  @ApiProperty({ description: '금액' })
  price: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '선택 사이즈', required: false })
  size: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '선택 색상', required: false })
  color: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '상품 이미지 URL', required: false })
  productImageUrl: string;

  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '상품명', required: false })
  productName: string;

  @Column({ default: false })
  @ApiProperty({ description: '리뷰 작성 여부' })
  isReviewed: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}
