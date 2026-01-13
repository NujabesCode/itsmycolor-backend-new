import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Column, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from './product.entity';

@Entity()
@Unique(['userId', 'productId'])
export class ProductLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.productLikes, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Product, (product) => product.productLikes, { onDelete: 'CASCADE' })
  product: Product;

  @Column()
  productId: string;

  @CreateDateColumn()
  createdAt: Date;
} 