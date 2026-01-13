import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ description: '통화', default: 'KRW' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: '상품 총액' })
  @IsNumber()
  @IsNotEmpty()
  productAmount: number;

  @ApiProperty({ description: '할인 금액', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @ApiProperty({ description: '배송비', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @ApiProperty({ description: '총 결제 금액' })
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty({ description: '우편번호' })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({ description: '배송지 주소' })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiProperty({ description: '상세 주소' })
  @IsString()
  @IsNotEmpty()
  detailAddress: string;

  @ApiProperty({ description: '받는 사람' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ description: '받는 사람 연락처' })
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiProperty({ description: '직접 입력 배송 요청사항', required: false })
  @IsString()
  @IsOptional()
  customDeliveryRequest?: string;

  @ApiProperty({ description: '개인정보 수집 및 이용 동의' })
  @IsBoolean()
  @IsNotEmpty()
  privacyAgreement: boolean;

  @ApiProperty({ description: '구매조건 확인 및 결제 진행 동의' })
  @IsBoolean()
  @IsNotEmpty()
  purchaseAgreement: boolean;

  @ApiProperty({ description: '주문 상품 목록', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];

  @ApiProperty({ description: '쿠폰 ID', required: false })
  @IsString()
  @IsOptional()
  couponId?: string;
}
