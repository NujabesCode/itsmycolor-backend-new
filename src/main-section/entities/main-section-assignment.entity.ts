import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

// slotKey는 ColorSeason 값 또는 BodyType 값 그대로 사용합니다.
@Entity('main_section_assignments')
@Unique('UQ_main_section_slot_product', ['slotKey', 'productId'])
export class MainSectionAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  slotKey: string; // 예: 'Spring Light', 'Straight'

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // 우선순위 제거: 고정 개념 없이 단순 배치(정렬은 프론트 고정)
  @Index()
  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


