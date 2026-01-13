import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Commission {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '수수료 설정 ID' })
  id: string;

  @Column({ default: 12 })
  @ApiProperty({ description: '기본 수수료율 (%)', example: 12 })
  defaultRate: number;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: '카테고리별 수수료율', required: false })
  categoryRates?: Record<string, number>;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: '브랜드별 수수료율', required: false })
  brandRates?: Record<string, number>;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}










