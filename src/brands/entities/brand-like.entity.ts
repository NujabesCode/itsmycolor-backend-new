import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Brand } from './brand.entity';

@Entity()
@Unique(['userId', 'brandId'])
export class BrandLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.brandLikes, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Brand, (brand) => brand.brandLikes, { onDelete: 'CASCADE' })
  brand: Brand;

  @Column()
  brandId: string;

  @CreateDateColumn()
  createdAt: Date;
} 