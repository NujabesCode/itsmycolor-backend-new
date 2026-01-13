import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
export class VerifyPaymentDto {
  @ApiProperty({ description: '결제 Key'})
  @IsString()
  @IsNotEmpty()
  paymentKey: string;

  @ApiProperty({ description: '주문 ID' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: '결제 금액' })
  @IsNumber()
  amount: number;
} 