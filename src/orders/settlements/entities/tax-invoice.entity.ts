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
import { Settlement } from './settlement.entity';
import { Brand } from '../../../brands/entities/brand.entity';

export enum TaxInvoiceStatus {
  PENDING = '발행 대기',
  ISSUED = '발행 완료',
  CANCELLED = '취소',
}

@Entity()
export class TaxInvoice {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '세금계산서 ID' })
  id: string;

  @ManyToOne(() => Settlement, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'settlementId' })
  settlement: Settlement;

  @Column()
  @ApiProperty({ description: '정산 ID' })
  settlementId: string;

  @ManyToOne(() => Brand, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ nullable: true })
  @ApiProperty({ description: '브랜드 ID', required: false })
  brandId: string;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: '세금계산서 번호' })
  invoiceNumber: string;

  @Column({ type: 'enum', enum: TaxInvoiceStatus, default: TaxInvoiceStatus.PENDING })
  @ApiProperty({ description: '세금계산서 상태', enum: TaxInvoiceStatus })
  status: TaxInvoiceStatus;

  @Column({ nullable: true })
  @ApiProperty({ description: '공급가액', required: false })
  supplyAmount: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '부가세', required: false })
  vatAmount: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '합계금액', required: false })
  totalAmount: number;

  @Column({ nullable: true })
  @ApiProperty({ description: '공급자 사업자번호', required: false })
  supplierBusinessNumber: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '공급받는자 사업자번호', required: false })
  buyerBusinessNumber: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '파일 URL', required: false })
  fileUrl: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '발행일', required: false })
  issuedAt: Date;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}










