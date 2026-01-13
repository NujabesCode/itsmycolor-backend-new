import { ApiProperty } from '@nestjs/swagger';
import { Coupon, CouponType } from '../entities/coupon.entity';

export class CouponResponseDto {
  @ApiProperty({ description: '쿠폰 ID' })
  id: string;

  @ApiProperty({ description: '쿠폰 이름' })
  name: string;

  @ApiProperty({ description: '쿠폰 설명', required: false })
  description?: string;

  @ApiProperty({ description: '쿠폰 타입', enum: CouponType })
  type: CouponType;

  @ApiProperty({ description: '쿠폰 값' })
  value: number;

  @ApiProperty({ description: '만료 일자', type: 'string', format: 'date-time' })
  expiredAt: Date;

  @ApiProperty({ description: '최소 주문 금액' })
  minPrice: number;

  @ApiProperty({ description: '사용 여부' })
  isUsed: boolean;

  constructor(coupon: Coupon) {
    this.id = coupon.id;
    this.name = coupon.name;
    this.description = coupon.description;
    this.type = coupon.type;
    this.value = coupon.value;
    this.expiredAt = coupon.expiredAt;
    this.minPrice = coupon.minPrice;
    this.isUsed = coupon.isUsed;
  }
}
