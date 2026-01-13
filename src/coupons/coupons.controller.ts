import { Controller, Get, UseGuards, Param, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('쿠폰')
@ApiBearerAuth()
@Controller('coupons')
@UseGuards(JwtAuthGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @ApiOperation({ summary: '내 쿠폰 목록 조회' })
  @Get()
  async findMyCoupons(@GetUser() user: User) {
    return this.couponsService.findByUserId(user.id);
  }

  @ApiOperation({ summary: '쿠폰 할인 계산 (주문 전 미리보기용)' })
  @Post('calculate-discount')
  async calculateDiscount(
    @GetUser() user: User,
    @Body() body: { couponId: string; orderAmount: number }
  ) {
    const { couponId, orderAmount } = body;
    const coupon = await this.couponsService.validateCoupon(couponId, user.id, orderAmount);
    const discountAmount = await this.couponsService.calculateDiscount(coupon, orderAmount);
    
    return {
      couponName: coupon.name,
      couponType: coupon.type,
      couponValue: coupon.value,
      discountAmount,
      finalAmount: orderAmount - discountAmount,
    };
  }
}
