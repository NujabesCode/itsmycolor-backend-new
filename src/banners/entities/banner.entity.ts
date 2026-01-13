import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum BannerVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subtitle?: string | null;

  @Column({ type: 'enum', enum: BannerVisibility, default: BannerVisibility.PRIVATE })
  visibility: BannerVisibility;

  // 1~3: 고정 슬롯(우선순위), 0: 비고정
  @Index()
  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagePcUrl?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageMobileUrl?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkUrl?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


