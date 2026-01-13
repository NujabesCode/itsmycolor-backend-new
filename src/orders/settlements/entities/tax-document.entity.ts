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

export enum DocumentStatus {
  PENDING = '제출 대기',
  SUBMITTED = '제출 완료',
  APPROVED = '승인',
  REJECTED = '반려',
}

export enum DocumentType {
  BUSINESS_LICENSE = '사업자등록증',
  TAX_CERTIFICATE = '세무서 발행 증명서',
  BANK_ACCOUNT = '통장 사본',
  OTHER = '기타',
}

@Entity()
export class TaxDocument {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '서류 ID' })
  id: string;

  @ManyToOne(() => Brand, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ nullable: true })
  @ApiProperty({ description: '브랜드 ID', required: false })
  brandId: string;

  @Column({ type: 'enum', enum: DocumentType })
  @ApiProperty({ description: '서류 유형', enum: DocumentType })
  documentType: DocumentType;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PENDING })
  @ApiProperty({ description: '서류 상태', enum: DocumentStatus })
  status: DocumentStatus;

  @Column({ nullable: true })
  @ApiProperty({ description: '파일 URL', required: false })
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '반려 사유', required: false })
  rejectionReason: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '승인일', required: false })
  approvedAt: Date;

  @CreateDateColumn()
  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}










