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
import { Brand } from '../../../brands/entities/brand.entity';

export enum SettlementStatus {
  PENDING = '정산대기',
  PAYMENT_SCHEDULED = '지급 예정', // FC-003: 정산 확정 시 상태
  COMPLETED = '지급 완료', // FC-004: 지급 완료 시 상태
}

@Entity()
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '정산 ID' })
  id: string;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: '정산 월' })
  settlementMonth: string;

  @Column()
  @ApiProperty({ description: '총 매출' })
  totalSales: number;

  @Column()
  @ApiProperty({ description: '수수료 (%)' })
  commissionRate: number;

  @Column()
  @ApiProperty({ description: '수수료 금액' })
  commissionAmount: number;

  @Column()
  @ApiProperty({ description: '실 정산 금액' })
  actualSettlementAmount: number;

  @Column({ type: 'enum', enum: SettlementStatus, default: SettlementStatus.PENDING })
  @ApiProperty({ description: '정산 상태', enum: SettlementStatus })
  status: SettlementStatus;

  @Column({ nullable: true })
  @ApiProperty({ description: '정산 은행', required: false })
  bank: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '계좌번호', required: false })
  accountNumber: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '예금주명', required: false })
  accountHolder: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '정산 완료일', required: false })
  settledAt: Date;
  
  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;
  
  @Column({ nullable: true })
  @ApiProperty({ description: '브랜드 ID', required: false })
  brandId: string;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
} 