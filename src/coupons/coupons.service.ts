import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Coupon, CouponType } from './entities/coupon.entity';
import { CouponResponseDto } from './dto/coupon-response.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async createCoupon(
    userId: string, 
    couponType: CouponType, 
    value: number, 
    expiredAt: Date, 
    minPrice: number,
    name: string,
    description?: string
  ) {
    const coupon = this.couponRepository.create({ 
      userId, 
      type: couponType, 
      value, 
      expiredAt, 
      minPrice,
      name,
      description
    });
    await this.couponRepository.save(coupon);
  }

  async findByUserId(userId: string): Promise<CouponResponseDto[]> {
    const coupons = await this.couponRepository.find({
      where: { userId, isUsed: false, expiredAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
    return coupons.map((coupon) => new CouponResponseDto(coupon));
  }

  async validateCoupon(couponId: string, userId: string, orderAmount: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ 
      where: { id: couponId } 
    });

    if (!coupon) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }

    // 본인 쿠폰인지 확인
    if (coupon.userId !== userId) {
      throw new BadRequestException('사용할 수 없는 쿠폰입니다.');
    }

    // 이미 사용된 쿠폰인지 확인
    if (coupon.isUsed) {
      throw new BadRequestException('이미 사용된 쿠폰입니다.');
    }

    // 만료일 확인
    if (new Date() > new Date(coupon.expiredAt)) {
      throw new BadRequestException('만료된 쿠폰입니다.');
    }

    // 최소 주문 금액 확인
    if (orderAmount < coupon.minPrice) {
      throw new BadRequestException(
        `최소 주문 금액 ${coupon.minPrice.toLocaleString()}원 이상 구매 시 사용 가능합니다.`
      );
    }

    return coupon;
  }

  async calculateDiscount(coupon: Coupon, orderAmount: number): Promise<number> {
    if (coupon.type === CouponType.PERCENT) {
      // 퍼센트 할인
      return Math.floor(orderAmount * (coupon.value / 100));
    } else {
      // 고정 금액 할인
      return Math.min(coupon.value, orderAmount);
    }
  }

  async useCoupon(couponId: string) {
    const coupon = await this.couponRepository.findOne({ where: { id: couponId } });
    if (!coupon) return;
    coupon.isUsed = true;
    await this.couponRepository.save(coupon);
  }

  async getCouponById(couponId: string): Promise<Coupon | null> {
    return await this.couponRepository.findOne({ where: { id: couponId } });
  }
}