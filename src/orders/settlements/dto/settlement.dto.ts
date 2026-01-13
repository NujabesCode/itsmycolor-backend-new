import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { SettlementStatus } from '../entities/settlement.entity';
import { Brand } from 'src/brands/entities/brand.entity';

export class CreateSettlementDto {
  @ApiProperty({ description: '정산 월', example: '2024-06' })
  @IsString()
  settlementMonth: string;

  @ApiProperty({ description: '총 매출', example: 2350000 })
  @IsNumber()
  totalSales: number;

  @ApiProperty({ description: '수수료 (%)', example: 12 })
  @IsNumber()
  commissionRate: number;

  @ApiProperty({ description: '수수료 금액', example: 282000 })
  @IsNumber()
  commissionAmount: number;

  @ApiProperty({ description: '실 정산 금액', example: 2068000 })
  @IsNumber()
  actualSettlementAmount: number;
}

export class UpdateSettlementDto {
  @ApiProperty({ description: '정산 상태', enum: SettlementStatus, example: SettlementStatus.COMPLETED })
  @IsEnum(SettlementStatus)
  @IsOptional()
  status?: SettlementStatus;

  @ApiProperty({ description: '정산 은행', example: 'KB국민' })
  @IsString()
  @IsOptional()
  bank?: string;

  @ApiProperty({ description: '계좌번호', example: '216502-04-359857' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiProperty({ description: '예금주명', example: '홍길동' })
  @IsString()
  @IsOptional()
  accountHolder?: string;

  @ApiProperty({ description: '정산 완료일', example: '2024-06-15T14:30:00.000Z' })
  @IsDateString()
  @IsOptional()
  settledAt?: Date;
}

export class SettlementResponseDto {
  @ApiProperty({ description: '정산 ID' })
  id: string;

  @ApiProperty({ description: '정산 월', example: '2024-06' })
  settlementMonth: string;

  @ApiProperty({ description: '총 매출', example: 2350000 })
  totalSales: number;

  @ApiProperty({ description: '수수료 (%)', example: 12 })
  commissionRate: number;

  @ApiProperty({ description: '수수료 금액', example: 282000 })
  commissionAmount: number;

  @ApiProperty({ description: '실 정산 금액', example: 2068000 })
  actualSettlementAmount: number;

  @ApiProperty({ description: '정산 상태', enum: SettlementStatus })
  status: SettlementStatus;

  @ApiProperty({ description: '정산 은행', required: false, example: 'KB국민' })
  bank?: string;

  @ApiProperty({ description: '계좌번호', required: false, example: '216502-04-359857' })
  accountNumber?: string;

  @ApiProperty({ description: '예금주명', required: false, example: '홍길동' })
  accountHolder?: string;

  @ApiProperty({ description: '정산 완료일', required: false })
  settledAt?: Date;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  brand?: Brand;

  constructor(partial: Partial<SettlementResponseDto>) {
    Object.assign(this, partial);
  }
}

export class SettlementStatsDto {
  @ApiProperty({ description: '정산 월', example: '2024-06' })
  month: string;

  @ApiProperty({ description: '총 매출', example: 2350000 })
  totalSales: number;

  @ApiProperty({ description: '수수료 금액', example: 282000 })
  commissionAmount: number;

  @ApiProperty({ description: '실 정산 금액', example: 2068000 })
  actualSettlementAmount: number;

  constructor(partial: Partial<SettlementStatsDto>) {
    Object.assign(this, partial);
  }
} 