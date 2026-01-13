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
import { Brand } from './brand.entity';

@Entity()
export class BrandConnectToken {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '토큰 레코드 ID' })
  id: string;

  @Column()
  @ApiProperty({ description: '브랜드 ID' })
  brandId: string;

  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column()
  @ApiProperty({ description: '연동 토큰' })
  token: string;

  @Column()
  @ApiProperty({ description: '만료 일시' })
  expiredAt: Date;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}

