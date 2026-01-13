import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { SettlementStatus } from '../entities/settlement.entity';

export class CreateSettlementDto {
  @ApiProperty({ description: '정산 월 (YYYY-MM)' })
  @IsString()
  settlementMonth: string;

  @ApiProperty({ description: '총 매출' })
  @IsNumber()
  totalSales: number;

  @ApiProperty({ description: '수수료 (%)' })
  @IsNumber()
  commissionRate: number;

  @ApiProperty({ description: '수수료 금액' })
  @IsNumber()
  commissionAmount: number;

  @ApiProperty({ description: '실 정산 금액' })
  @IsNumber()
  actualSettlementAmount: number;

  @ApiProperty({ description: '정산 상태', enum: SettlementStatus, default: SettlementStatus.PENDING })
  @IsEnum(SettlementStatus)
  @IsOptional()
  status?: SettlementStatus;

  @ApiProperty({ description: '정산 은행', required: false })
  @IsString()
  @IsOptional()
  bank?: string;

  @ApiProperty({ description: '계좌번호', required: false })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiProperty({ description: '예금주명', required: false })
  @IsString()
  @IsOptional()
  accountHolder?: string;

  @ApiProperty({ description: '브랜드 ID', required: false })
  @IsString()
  @IsOptional()
  brandId?: string;
} 