import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { ReturnStatus, ReturnReason } from '../entities/return-request.entity';

export class CreateReturnRequestDto {
  @ApiProperty({ description: '주문 ID' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: '주문 상품 ID' })
  @IsUUID()
  orderItemId: string;

  @ApiProperty({ description: '반품 사유', enum: ReturnReason })
  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @ApiProperty({ description: '상세 사유', required: false })
  @IsString()
  @IsOptional()
  detailReason?: string;

  @ApiProperty({ description: '환불 계좌 은행', required: false })
  @IsString()
  @IsOptional()
  refundBank?: string;

  @ApiProperty({ description: '환불 계좌 번호', required: false })
  @IsString()
  @IsOptional()
  refundAccountNumber?: string;

  @ApiProperty({ description: '환불 예금주', required: false })
  @IsString()
  @IsOptional()
  refundAccountHolder?: string;
}

export class UpdateReturnRequestDto {
  @ApiProperty({ description: '반품 상태', enum: ReturnStatus })
  @IsEnum(ReturnStatus)
  @IsOptional()
  status?: ReturnStatus;

  @ApiProperty({ description: '반품 운송장 번호', required: false })
  @IsString()
  @IsOptional()
  returnTrackingNumber?: string;

  @ApiProperty({ description: '반품 거부 사유', required: false })
  @IsString()
  @IsOptional()
  rejectReason?: string;

  @ApiProperty({ description: '환불 금액', required: false })
  @IsNumber()
  @IsOptional()
  refundAmount?: number;
}

export class ReturnRequestResponseDto {
  @ApiProperty({ description: '반품 요청 ID' })
  id: string;

  @ApiProperty({ description: '반품 요청 번호' })
  returnNumber: string;

  @ApiProperty({ description: '반품 상태', enum: ReturnStatus })
  status: ReturnStatus;

  @ApiProperty({ description: '반품 사유', enum: ReturnReason })
  reason: ReturnReason;

  @ApiProperty({ description: '상세 사유', required: false })
  detailReason?: string;

  @ApiProperty({ description: '반품 승인 일시', required: false })
  approvedAt?: Date;

  @ApiProperty({ description: '반품 완료 일시', required: false })
  completedAt?: Date;

  @ApiProperty({ description: '반품 거부 일시', required: false })
  rejectedAt?: Date;

  @ApiProperty({ description: '반품 거부 사유', required: false })
  rejectReason?: string;

  @ApiProperty({ description: '반품 운송장 번호', required: false })
  returnTrackingNumber?: string;

  @ApiProperty({ description: '환불 계좌 은행', required: false })
  refundBank?: string;

  @ApiProperty({ description: '환불 계좌 번호', required: false })
  refundAccountNumber?: string;

  @ApiProperty({ description: '환불 예금주', required: false })
  refundAccountHolder?: string;

  @ApiProperty({ description: '환불 금액', required: false })
  refundAmount?: number;

  @ApiProperty({ description: '환불 완료 일시', required: false })
  refundedAt?: Date;

  @ApiProperty({ description: '사용자 정보', required: false })
  user?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ description: '주문 정보' })
  order: {
    id: string;
  };

  @ApiProperty({ description: '주문 상품 정보' })
  orderItem: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
  };

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  constructor(partial: Partial<ReturnRequestResponseDto>) {
    Object.assign(this, partial);
  }
}
