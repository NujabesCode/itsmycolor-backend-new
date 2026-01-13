import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { PaymentsService } from 'src/payments/services/payments.service';
import { UpdateManyOrderStatusDto } from './dto/update-many-order-status.dto';
import { CouponsService } from 'src/coupons/coupons.service';
import { Coupon } from 'src/coupons/entities/coupon.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
    private couponsService: CouponsService,
    private dataSource: DataSource,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    userId: string,
  ): Promise<OrderDetailResponseDto> {
    const { orderItems, couponId, ...orderData } = createOrderDto;

    // 주문 상품 총액 계산
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discountAmount = 0;
    let validatedCoupon: Coupon | null = null;

    // 쿠폰 검증 및 할인 계산
    if (couponId) {
      const coupon = await this.couponsService.validateCoupon(couponId, userId, subtotal);
      if (coupon) {
        validatedCoupon = coupon;
        discountAmount = await this.couponsService.calculateDiscount(coupon, subtotal);
      }
    }

    // 실제 총액 계산 (상품총액 - 할인 + 배송비)
    const calculatedTotalAmount = subtotal - discountAmount + (orderData.shippingFee || 0);

    // 프론트엔드에서 보낸 총액과 서버 계산 총액 비교
    if (Math.abs(calculatedTotalAmount - orderData.totalAmount) > 1) {
      throw new BadRequestException('주문 금액이 일치하지 않습니다.');
    }

    // 주문 생성 및 주문 상품 등록을 위한 트랜잭션 처리
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 주문 생성 (할인 금액 포함)
      const order = this.orderRepository.create({
        ...orderData,
        userId,
        status: OrderStatus.PENDING,
        discountAmount, // 서버에서 계산한 할인 금액 저장
        totalAmount: calculatedTotalAmount, // 서버에서 계산한 총액 저장
      });

      const savedOrder = await queryRunner.manager.save(order);

      // 2. 주문 상품 등록
      await Promise.all(
        orderItems.map(async (item: CreateOrderItemDto) => {
          const orderItem = this.orderItemRepository.create({
            ...item,
            orderId: savedOrder.id,
          });
          return queryRunner.manager.save(orderItem);
        }),
      );

      // 3. 쿠폰 사용처리
      if (couponId && validatedCoupon) {
        await this.couponsService.useCoupon(couponId);
      }

      await queryRunner.commitTransaction();

      return new OrderDetailResponseDto(
        await this.findOne(savedOrder.id, userId),
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{
    orders: OrderResponseDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const { page = 1, limit = 10, status, startDate, endDate, search } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('product.brandEntity', 'brand')
      .leftJoinAndSelect('order.payment', 'payment')
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // OC-001: 날짜 필터
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      });
    }

    // OC-002: 주문번호 검색
    if (search) {
      queryBuilder.andWhere('order.id LIKE :search', { search: `%${search}%` });
    }

    // OC-003: 상태 필터
    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders: orders.map((order) => new OrderResponseDto(order)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findAllByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
    },
  ): Promise<{
    orders: OrderResponseDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('product.brandEntity', 'brand')
      .where('order.userId = :userId', { userId })
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders: orders.map((order) => new OrderResponseDto(order)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // 사용자별 주문 조회 (컨트롤러용 메서드 이름)
  async findByUserId(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.findAllByUser(userId, options);
  }

  async findByBrandId(
    brandId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      statuses?: string[];
      search?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{
    orders: OrderResponseDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const { page = 1, limit = 10, status, statuses, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('product.brandEntity', 'brand')
      .where('brand.id = :brandId', { brandId });

    // OM-003, OM-005: 주문 상태 필터 (단일 또는 다중)
    if (statuses && statuses.length > 0) {
      queryBuilder.andWhere('order.status IN (:...statuses)', { statuses });
    } else if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    // OM-002: 주문번호 검색
    if (search) {
      queryBuilder.andWhere('order.id LIKE :search', { search: `%${search}%` });
    }

    // OM-004, OM-005: 날짜 필터
    if (startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate: end });
    }

    // OM-008: 정렬 기능
    const validSortFields: Record<string, string> = {
      'id': 'order.id',
      'createdAt': 'order.createdAt',
      'totalAmount': 'order.totalAmount',
      'status': 'order.status',
    };
    const sortField = validSortFields[sortBy] || 'order.createdAt';
    queryBuilder.orderBy(sortField, sortOrder);

    queryBuilder.skip(skip).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders: orders.map((order) => new OrderResponseDto(order)),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findMonthlyByBrandId(
    brandId: string,
    options: { year: number; month: number },
  ) {
    const startDate = new Date(options.year, options.month - 1, 1);
    const endDate = new Date(options.year, options.month, 0);

    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('product.brandEntity', 'brand')
      .where('brand.id = :brandId', { brandId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    return orders.map((order) => new OrderResponseDto(order));
  }

  async findTodayByBrandId(brandId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('product.brandEntity', 'brand')
      .where('brand.id = :brandId', { brandId })
      .andWhere('order.createdAt BETWEEN :today AND :tomorrow', {
        today,
        tomorrow,
      })
      .getMany();

    return orders.map((order) => new OrderResponseDto(order));
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'orderItems', 'orderItems.product', 'orderItems.product.brandEntity', 'payment'],
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    if (userId && order.userId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return order;
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    userId?: string,
  ): Promise<Order> {
    const order = await this.findOne(id, userId);

    // OM-025: 완료된 주문 상태에서 재처리 방지
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      if (updateOrderStatusDto.status && 
          updateOrderStatusDto.status !== OrderStatus.DELIVERED && 
          updateOrderStatusDto.status !== OrderStatus.CANCELLED) {
        throw new BadRequestException('배송 완료 또는 취소된 주문은 재처리할 수 없습니다.');
      }
    }

    // OC-005: 송장 입력 시 배송 중 상태로 변경
    if (updateOrderStatusDto.deliveryCompany && updateOrderStatusDto.deliveryTrackingNumber) {
      // OM-023: 송장번호 미입력 검증
      if (!updateOrderStatusDto.deliveryTrackingNumber.trim()) {
        throw new BadRequestException('송장번호를 입력해주세요.');
      }

      // OM-024: 동일 송장번호 중복 검증
      const existingOrder = await this.orderRepository.findOne({
        where: { deliveryTrackingNumber: updateOrderStatusDto.deliveryTrackingNumber.trim() },
      });
      if (existingOrder && existingOrder.id !== id) {
        throw new BadRequestException('이미 등록된 송장번호입니다.');
      }

      order.deliveryCompany = updateOrderStatusDto.deliveryCompany;
      order.deliveryTrackingNumber = updateOrderStatusDto.deliveryTrackingNumber.trim();
      if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.SHIPPED) {
        order.status = OrderStatus.DELIVERING;
      }
    }

    // OC-007: 상태 변경
    if (updateOrderStatusDto.status) {
      order.status = updateOrderStatusDto.status;
    }

    return this.orderRepository.save(order);
  }

  // OC-005: 송장 입력 (관리자용)
  // OM-023, OM-024: 송장번호 검증 추가
  async updateShippingInfo(
    id: string,
    deliveryCompany: string,
    deliveryTrackingNumber: string,
  ): Promise<Order> {
    const order = await this.findOne(id);
    
    // OM-023: 송장번호 미입력 검증
    if (!deliveryTrackingNumber || !deliveryTrackingNumber.trim()) {
      throw new BadRequestException('송장번호를 입력해주세요.');
    }

    // OM-024: 동일 송장번호 중복 검증
    const existingOrder = await this.orderRepository.findOne({
      where: { deliveryTrackingNumber: deliveryTrackingNumber.trim() },
    });
    if (existingOrder && existingOrder.id !== id) {
      throw new BadRequestException('이미 등록된 송장번호입니다.');
    }
    
    order.deliveryCompany = deliveryCompany;
    order.deliveryTrackingNumber = deliveryTrackingNumber.trim();
    order.status = OrderStatus.DELIVERING;
    
    return this.orderRepository.save(order);
  }

  // OC-008: 부분 배송 처리
  async partialShipping(
    id: string,
    orderItemIds: string[],
    deliveryCompany: string,
    deliveryTrackingNumber: string,
  ): Promise<Order> {
    const order = await this.findOne(id);
    
    // 부분 배송된 아이템은 별도 처리 필요 (현재는 주문 상태만 변경)
    // 실제로는 OrderItem에 배송 상태를 추가해야 함
    order.deliveryCompany = deliveryCompany;
    order.deliveryTrackingNumber = deliveryTrackingNumber;
    // 부분 배송 시 상태는 "배송 중"으로 유지하되, 일부만 배송됨을 표시
    order.status = OrderStatus.DELIVERING;
    
    return this.orderRepository.save(order);
  }

  // OC-009: 배송 지연 체크 (SLA: 주문 후 3일 이내 배송 시작)
  async checkDeliveryDelay(): Promise<Order[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const delayedOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED],
      })
      .andWhere('order.createdAt < :threeDaysAgo', { threeDaysAgo })
      .andWhere('order.deliveryTrackingNumber IS NULL')
      .getMany();
    
    return delayedOrders;
  }

  // 상태만 업데이트하는 메서드 (PaymentsService에서 사용)
  async updateOnlyStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(orderId);
    order.status = status;
    return this.orderRepository.save(order);
  }

  // OM-021, OM-022, OM-026: 일괄 처리 (상태 제약 검증 포함)
  async updateManyStatus(
    updateManyOrderStatusDto: UpdateManyOrderStatusDto,
  ): Promise<{ success: number; failed: number; failedIds: string[] }> {
    const { orderIds, status } = updateManyOrderStatusDto;

    // 모든 주문 조회
    const orders = await this.orderRepository.find({
      where: { id: In(orderIds) },
    });

    const successIds: string[] = [];
    const failedIds: string[] = [];

    // OM-026: 각 주문의 상태를 확인하여 처리 가능한 것만 처리
    for (const order of orders) {
      // OM-025: 완료된 주문은 재처리 불가
      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        if (status !== OrderStatus.DELIVERED && status !== OrderStatus.CANCELLED) {
          failedIds.push(order.id);
          continue;
        }
      }

      // 승인 가능한 상태 체크 (CONFIRMED -> SHIPPED만 가능)
      if (status === OrderStatus.SHIPPED && order.status !== OrderStatus.CONFIRMED) {
        failedIds.push(order.id);
        continue;
      }

      successIds.push(order.id);
    }

    // 처리 가능한 주문만 업데이트
    if (successIds.length > 0) {
      await this.orderRepository.update(
        { id: In(successIds) },
        { status },
      );
    }

    return {
      success: successIds.length,
      failed: failedIds.length,
      failedIds,
    };
  }

  async confirmDelivery(orderId: string, userId: string): Promise<Order> {
    const order = await this.findOne(orderId, userId);
    
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('배송 중인 주문만 구매확정이 가능합니다.');
    }
    
    order.status = OrderStatus.DELIVERED;
    return this.orderRepository.save(order);
  }

  async cancel(orderId: string, userId: string): Promise<Order> {
    const order = await this.findOne(orderId, userId);
    
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BadRequestException('취소할 수 없는 주문입니다.');
    }
    
    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }
}