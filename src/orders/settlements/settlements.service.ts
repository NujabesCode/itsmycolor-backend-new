import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Settlement, SettlementStatus } from './entities/settlement.entity';
import {
  CreateSettlementDto,
  UpdateSettlementDto,
  SettlementResponseDto,
  SettlementStatsDto,
} from './dto/settlement.dto';
import { OrdersService } from '../orders.service';
import { OrderStatus, Order } from '../entities/order.entity';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private settlementRepository: Repository<Settlement>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private ordersService: OrdersService,
  ) {}

  async create(createSettlementDto: CreateSettlementDto): Promise<SettlementResponseDto> {
    const settlement = this.settlementRepository.create(createSettlementDto);
    const savedSettlement = await this.settlementRepository.save(settlement);
    return new SettlementResponseDto(savedSettlement);
  }

  async findAll(options: { brandId?: string, year?: number, month?: number, startDate?: string, endDate?: string }): Promise<SettlementResponseDto[]> {
    const { brandId, year, month, startDate, endDate } = options;

    const queryBuilder = this.settlementRepository.createQueryBuilder('settlement')
      .leftJoinAndSelect('settlement.brand', 'brand');

    if (brandId) {
      queryBuilder.andWhere('settlement.brandId = :brandId', { brandId });
    }

    if (year !== undefined && month !== undefined && year > 0 && month > 0) {
      const monthStr = String(month).padStart(2, '0');
      queryBuilder.andWhere('settlement.settlementMonth = :settlementMonth', {
        settlementMonth: `${year}-${monthStr}`,
      });
    }

    // FC-001: 기간 필터 추가
    // startDate와 endDate가 있으면 정산 기간(settlementMonth)이 해당 기간과 겹치는 정산을 조회
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      // 정산 기간(settlementMonth)이 검색 기간과 겹치는지 확인
      // settlementMonth 형식: "YYYY-MM" 또는 "YYYY-MM-전체"
      // 검색 기간의 시작 월과 종료 월 계산
      const startYear = start.getFullYear();
      const startMonth = start.getMonth() + 1;
      const endYear = end.getFullYear();
      const endMonth = end.getMonth() + 1;
      
      // settlementMonth를 파싱하여 검색 기간과 겹치는지 확인
      // 예: settlementMonth가 "2024-01"이고 검색 기간이 2024-01-01 ~ 2024-01-31이면 포함
      // 또는 settlementMonth가 "2024-01-전체"이고 검색 기간이 2024-01-01 ~ 2024-12-31이면 포함
      const startMonthStr = `${startYear}-${String(startMonth).padStart(2, '0')}`;
      const endMonthStr = `${endYear}-${String(endMonth).padStart(2, '0')}`;
      
      // settlementMonth가 검색 기간의 시작 월과 종료 월 사이에 있는 정산 조회
      // 또는 "전체" 기간 정산의 경우 시작 월이 검색 기간 내에 있는지 확인
      queryBuilder.andWhere(
        '(settlement.settlementMonth >= :startMonthStr AND settlement.settlementMonth <= :endMonthStr) OR (settlement.settlementMonth LIKE :startMonthPattern) OR (settlement.settlementMonth LIKE :endMonthPattern)',
        {
          startMonthStr,
          endMonthStr,
          startMonthPattern: `${startMonthStr}-%`,
          endMonthPattern: `${endMonthStr}-%`,
        }
      );
    } else if (startDate) {
      // startDate만 있는 경우
      const start = new Date(startDate);
      const startYear = start.getFullYear();
      const startMonth = start.getMonth() + 1;
      const startMonthStr = `${startYear}-${String(startMonth).padStart(2, '0')}`;
      queryBuilder.andWhere(
        'settlement.settlementMonth >= :startMonthStr OR settlement.settlementMonth LIKE :startMonthPattern',
        {
          startMonthStr,
          startMonthPattern: `${startMonthStr}-%`,
        }
      );
    } else if (endDate) {
      // endDate만 있는 경우
      const end = new Date(endDate);
      const endYear = end.getFullYear();
      const endMonth = end.getMonth() + 1;
      const endMonthStr = `${endYear}-${String(endMonth).padStart(2, '0')}`;
      queryBuilder.andWhere(
        'settlement.settlementMonth <= :endMonthStr OR settlement.settlementMonth LIKE :endMonthPattern',
        {
          endMonthStr,
          endMonthPattern: `${endMonthStr}-%`,
        }
      );
    }

    const settlements = await queryBuilder
      .orderBy('settlement.createdAt', 'DESC')
      .getMany();

    return settlements.map(settlement => new SettlementResponseDto({
        id: settlement.id,
        settlementMonth: settlement.settlementMonth,
        totalSales: settlement.totalSales,
        commissionRate: settlement.commissionRate,
        commissionAmount: settlement.commissionAmount,
        actualSettlementAmount: settlement.actualSettlementAmount,
        status: settlement.status,
        brand: settlement.brand,
        bank: settlement.bank,
        accountNumber: settlement.accountNumber,
        accountHolder: settlement.accountHolder,
        settledAt: settlement.settledAt,
        createdAt: settlement.createdAt,
        updatedAt: settlement.updatedAt
      }));
  }

  async findOne(id: string): Promise<SettlementResponseDto> {
    const settlement = await this.settlementRepository.findOne({
      where: { id },
      relations: ['brand'],
    });

    if (!settlement) {
      throw new NotFoundException('정산 내역을 찾을 수 없습니다.');
    }

    // SettlementResponseDto로 변환하여 반환
    return new SettlementResponseDto({
      id: settlement.id,
      settlementMonth: settlement.settlementMonth,
      totalSales: settlement.totalSales,
      commissionRate: settlement.commissionRate,
      commissionAmount: settlement.commissionAmount,
      actualSettlementAmount: settlement.actualSettlementAmount,
      status: settlement.status,
      brand: settlement.brand,
      bank: settlement.bank,
      accountNumber: settlement.accountNumber,
      accountHolder: settlement.accountHolder,
      settledAt: settlement.settledAt,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt
    });
  }

  async update(id: string, updateSettlementDto: UpdateSettlementDto): Promise<SettlementResponseDto> {
    const settlement = await this.findOneEntity(id);
    
    // 정산 완료 상태로 변경 시 정산 완료일 자동 설정
    if (updateSettlementDto.status === SettlementStatus.COMPLETED && !updateSettlementDto.settledAt) {
      updateSettlementDto.settledAt = new Date();
    }

    Object.assign(settlement, updateSettlementDto);
    await this.settlementRepository.save(settlement);
    
    return this.findOne(id);
  }

  // 엔티티를 직접 반환하는 메서드 추가
  private async findOneEntity(id: string): Promise<Settlement> {
    const settlement = await this.settlementRepository.findOne({
      where: { id },
      relations: ['brand'],
    });

    if (!settlement) {
      throw new NotFoundException('정산 내역을 찾을 수 없습니다.');
    }

    return settlement;
  }

  async getStats(startDate?: string, endDate?: string): Promise<SettlementStatsDto[]> {
    let whereCondition = {};
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      whereCondition = {
        createdAt: Between(start, end),
      };
    }
    
    const settlements = await this.settlementRepository.find({
      where: whereCondition,
      order: { settlementMonth: 'DESC' },
    });
    
    // 월별로 정산 데이터 그룹화
    const monthlyStats = settlements.reduce((acc: Record<string, any>, settlement) => {
      const { settlementMonth } = settlement;
      
      if (!acc[settlementMonth]) {
        acc[settlementMonth] = {
          month: settlementMonth,
          totalSales: 0,
          commissionAmount: 0,
          actualSettlementAmount: 0,
        };
      }
      
      acc[settlementMonth].totalSales += settlement.totalSales;
      acc[settlementMonth].commissionAmount += settlement.commissionAmount;
      acc[settlementMonth].actualSettlementAmount += settlement.actualSettlementAmount;
      
      return acc;
    }, {});
    
    return Object.values(monthlyStats).map(stat => new SettlementStatsDto(stat));
  }

  async calculateMonthlySettlement(year?: number, month?: number): Promise<SettlementResponseDto> {
    // 년도와 월이 제공되지 않았다면 현재 날짜 기준 이전 달 계산
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || (now.getMonth() === 0 ? 12 : now.getMonth());
    const targetYear2 = targetMonth === 12 && !year ? targetYear - 1 : targetYear;
    
    // 해당 월의 시작일과 종료일 계산
    const startDate = new Date(targetYear2, targetMonth - 1, 1);
    const endDate = new Date(targetYear2, targetMonth, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // 해당 월의 정산이 이미 있는지 확인
    const monthStr = String(targetMonth).padStart(2, '0');
    const settlementMonth = `${targetYear2}-${monthStr}`;
    const existingSettlement = await this.settlementRepository.findOne({
      where: { settlementMonth },
    });
    
    if (existingSettlement) {
      throw new BadRequestException(`${settlementMonth} 기간의 정산이 이미 존재합니다.`);
    }
    
    // 해당 월의 완료된 주문 조회
    // DELIVERED 상태의 주문만 조회하되, 없으면 totalAmount > 0인 주문도 포함
    let { orders } = await this.ordersService.findAll({
      status: OrderStatus.DELIVERED,
    });
    
    // DELIVERED 상태 주문이 없으면 totalAmount > 0인 모든 주문 조회 (임시 조치)
    if (!orders || orders.length === 0) {
      console.log(`[calculateMonthlySettlement] DELIVERED 주문 없음, totalAmount > 0인 주문 조회`);
      const allOrdersResult = await this.ordersService.findAll({});
      orders = allOrdersResult.orders.filter(order => order.totalAmount && order.totalAmount > 0);
      console.log(`[calculateMonthlySettlement] totalAmount > 0인 주문 수:`, orders.length);
    }
    
    // 해당 기간 내의 주문 필터링
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    console.log(`[calculateMonthlySettlement] ${settlementMonth} 기간 내 주문 수:`, filteredOrders.length);
    
    if (filteredOrders.length === 0) {
      throw new BadRequestException(`${settlementMonth} 기간에 정산할 주문이 없습니다.`);
    }
    
    // 총 매출 계산
    const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // 수수료 계산 (예: 12%)
    const commissionRate = 0;
    const commissionAmount = Math.round(totalSales * (commissionRate / 100));
    
    // 실 정산 금액
    const actualSettlementAmount = totalSales - commissionAmount;
    
    // 정산 정보 생성
    const createSettlementDto: CreateSettlementDto = {
      settlementMonth,
      totalSales,
      commissionRate,
      commissionAmount,
      actualSettlementAmount,
    };
    
    return this.create(createSettlementDto);
  }

  // 브랜드별 정산 생성
  async createBrandSettlement(brandId: string, createSettlementDto: CreateSettlementDto): Promise<Settlement> {
    const settlement = this.settlementRepository.create({
      ...createSettlementDto,
      brandId,
    });
    
    return this.settlementRepository.save(settlement);
  }

  // 브랜드별 정산 자동 계산
  async calculateBrandSettlement(
    brandId: string,
    year?: number,
    month?: number,
    commissionRate: number = 12, // 기본값은 12이지만, 컨트롤러에서 0도 전달 가능
  ): Promise<SettlementResponseDto> {
    try {
      console.log(`[calculateBrandSettlement] 시작: brandId=${brandId}, year=${year}, month=${month}, commissionRate=${commissionRate}`);
      
      // 년도와 월이 제공되지 않으면 전체 기간으로 설정
    let startDate: Date;
    let endDate: Date;
    let settlementMonth: string;
    
    if (year !== undefined && month !== undefined && year > 0 && month > 0) {
      // 해당 월의 시작일과 종료일 계산
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);
      const monthStr = String(month).padStart(2, '0');
      settlementMonth = `${year}-${monthStr}`;
      
      // 해당 브랜드의 해당 월 정산이 이미 있는지 확인
      const existingSettlement = await this.settlementRepository.findOne({
        where: { brandId, settlementMonth },
      });
      
      if (existingSettlement) {
        throw new BadRequestException(`${settlementMonth} 기간의 ${brandId} 브랜드 정산이 이미 존재합니다.`);
      }
    } else {
      // 전체 기간: 최초 주문일부터 현재까지
      startDate = new Date(0); // 1970-01-01
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      // 전체 기간인 경우 "전체"로 설정
      settlementMonth = '전체';
      
      // 전체 기간인 경우 중복 체크는 하지 않음 (같은 브랜드의 전체 기간 정산은 여러 개 생성 가능)
    }
    
    // 해당 브랜드의 해당 기간 내 주문 조회
    // 모든 주문을 가져온 후 orderItems에서 해당 브랜드 상품만 필터링
    console.log(`[calculateBrandSettlement] 날짜 범위: ${startDate.toISOString()} ~ ${endDate.toISOString()}`);
    
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('product.brandEntity', 'brand')
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.createdAt <= :endDate', { endDate })
      .andWhere('order.totalAmount > 0'); // totalAmount > 0인 주문만 조회
    
    const allOrders = await queryBuilder.getMany();
    
    console.log(`[calculateBrandSettlement] 전체 주문 수 (totalAmount > 0): ${allOrders.length}`);
    
    // 디버깅: 각 주문의 orderItems와 브랜드 정보 확인
    allOrders.forEach((order, idx) => {
      console.log(`[calculateBrandSettlement] 주문 ${idx + 1} (ID: ${order.id}):`);
      console.log(`  - orderItems 수: ${order.orderItems?.length || 0}`);
      if (order.orderItems && order.orderItems.length > 0) {
        order.orderItems.forEach((item, itemIdx) => {
          const productId = item.product?.id || '없음';
          const brandIdInItem = item.product?.brandEntity?.id || '없음';
          const brandName = item.product?.brandEntity?.name || '없음';
          console.log(`  - 상품 ${itemIdx + 1}: productId=${productId}, brandId=${brandIdInItem}, brandName=${brandName}, price=${item.price}, quantity=${item.quantity}`);
        });
      }
    });
    
    // 해당 브랜드의 상품이 포함된 주문만 필터링
    const orders = allOrders.filter(order => {
      if (!order.orderItems || order.orderItems.length === 0) {
        console.log(`[calculateBrandSettlement] 주문 ${order.id}: orderItems가 없음`);
        return false;
      }
      const hasBrandItem = order.orderItems.some(item => {
        const itemBrandId = item.product?.brandEntity?.id;
        const matches = itemBrandId === brandId;
        if (matches) {
          console.log(`[calculateBrandSettlement] 주문 ${order.id}: 브랜드 매칭 발견 - itemBrandId=${itemBrandId}, targetBrandId=${brandId}`);
        }
        return matches;
      });
      if (!hasBrandItem) {
        const brandIds = order.orderItems.map(item => item.product?.brandEntity?.id).filter(Boolean);
        console.log(`[calculateBrandSettlement] 주문 ${order.id}: 브랜드 매칭 안됨 - 포함된 브랜드 IDs:`, brandIds);
      }
      return hasBrandItem;
    });
    
    console.log(`[calculateBrandSettlement] 해당 브랜드(${brandId}) 포함 주문 수: ${orders.length}`);
    
    // 해당 브랜드의 상품 금액만 계산
    let totalSales = 0;
    const orderIds = new Set<string>();
    
    // 디버깅: 주문별 상세 정보 로깅
    for (const order of orders) {
      if (!order.orderItems || order.orderItems.length === 0) {
        console.log(`[calculateBrandSettlement] 주문 ${order.id}: orderItems가 없음`);
        continue;
      }
      
      console.log(`[calculateBrandSettlement] 주문 ${order.id} 분석: orderItems 수=${order.orderItems.length}`);
      
      // 해당 브랜드의 상품만 필터링하여 금액 계산
      const brandItems = order.orderItems.filter(item => {
        const itemBrandId = item.product?.brandEntity?.id;
        const matches = itemBrandId === brandId;
        if (matches) {
          console.log(`[calculateBrandSettlement] 주문 ${order.id}: 브랜드 매칭 상품 발견 - productId=${item.product?.id}, price=${item.price}, quantity=${item.quantity}`);
        }
        return matches;
      });
      
      if (brandItems.length === 0) {
        console.log(`[calculateBrandSettlement] 주문 ${order.id}: 해당 브랜드(${brandId}) 상품 없음`);
        // 디버깅: 주문의 모든 상품 브랜드 ID 출력
        const allBrandIds = order.orderItems.map(item => item.product?.brandEntity?.id).filter(Boolean);
        console.log(`[calculateBrandSettlement] 주문 ${order.id}: 포함된 브랜드 IDs:`, allBrandIds);
        continue;
      }
      
      // 해당 브랜드 상품의 총액 계산 (수량 * 가격)
      const brandTotal = brandItems.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        console.log(`[calculateBrandSettlement] 주문 ${order.id}: 상품 금액 계산 - price=${item.price}, quantity=${item.quantity}, total=${itemTotal}`);
        return sum + itemTotal;
      }, 0);
      
      console.log(`[calculateBrandSettlement] 주문 ${order.id}: 브랜드 상품 ${brandItems.length}개, 브랜드 총액 ${brandTotal}원`);
      
      if (brandTotal > 0) {
        totalSales += brandTotal;
        orderIds.add(order.id);
        console.log(`[calculateBrandSettlement] 주문 ${order.id}: 정산에 포함됨 (누적 총매출: ${totalSales}원)`);
      } else {
        console.log(`[calculateBrandSettlement] 주문 ${order.id}: 브랜드 총액이 0이므로 제외`);
      }
    }
    
    console.log(`[calculateBrandSettlement] 브랜드 ${brandId}, ${settlementMonth} 기간 내 주문 수:`, orderIds.size);
    console.log(`[calculateBrandSettlement] 총 매출:`, totalSales);
    
    if (totalSales === 0) {
      // 더 자세한 에러 메시지 제공
      const orderCount = allOrders.length;
      const brandOrderCount = orders.length;
      const periodText = settlementMonth === '전체' ? '전체 기간' : `${settlementMonth} 기간`;
      throw new BadRequestException(
        `${periodText}에 해당 브랜드의 정산할 주문이 없습니다. ` +
        `(전체 주문 수: ${orderCount}, 해당 브랜드 포함 주문 수: ${brandOrderCount})`
      );
    }
    
    // 수수료 계산
    const commissionAmount = Math.round(totalSales * (commissionRate / 100));
    
    // 실 정산 금액
    const actualSettlementAmount = totalSales - commissionAmount;
    
    // 정산 정보 생성
    const settlement = this.settlementRepository.create({
      settlementMonth,
      totalSales,
      commissionRate,
      commissionAmount,
      actualSettlementAmount,
      brandId,
    });
    
    console.log(`[calculateBrandSettlement] 정산 저장 시도:`, { settlementMonth, totalSales, brandId });
    const savedSettlement = await this.settlementRepository.save(settlement);
    console.log(`[calculateBrandSettlement] 정산 저장 완료:`, savedSettlement);
    
    // 저장된 정산을 다시 조회하여 브랜드 정보 포함
    const settlementId = Array.isArray(savedSettlement) ? savedSettlement[0]?.id : savedSettlement?.id;
    if (!settlementId) {
      console.error(`[calculateBrandSettlement] 저장된 정산 ID를 찾을 수 없음:`, savedSettlement);
      throw new NotFoundException('정산 저장 후 ID를 찾을 수 없습니다.');
    }
    
    console.log(`[calculateBrandSettlement] 정산 ID로 조회:`, settlementId);
    const settlementWithBrand = await this.settlementRepository.findOne({
      where: { id: settlementId },
      relations: ['brand'],
    });
    
    if (!settlementWithBrand) {
      console.error(`[calculateBrandSettlement] 정산 조회 실패: ID=${settlementId}`);
      throw new NotFoundException('정산 생성 후 조회에 실패했습니다.');
    }
    
    console.log(`[calculateBrandSettlement] 정산 조회 완료:`, settlementWithBrand);
    
    return new SettlementResponseDto({
      id: settlementWithBrand.id,
      settlementMonth: settlementWithBrand.settlementMonth,
      totalSales: settlementWithBrand.totalSales,
      commissionRate: settlementWithBrand.commissionRate,
      commissionAmount: settlementWithBrand.commissionAmount,
      actualSettlementAmount: settlementWithBrand.actualSettlementAmount,
      status: settlementWithBrand.status,
      brand: settlementWithBrand.brand,
      bank: settlementWithBrand.bank,
      accountNumber: settlementWithBrand.accountNumber,
      accountHolder: settlementWithBrand.accountHolder,
      settledAt: settlementWithBrand.settledAt,
      createdAt: settlementWithBrand.createdAt,
      updatedAt: settlementWithBrand.updatedAt
    });
    } catch (error) {
      console.error(`[calculateBrandSettlement] 에러 발생:`, error);
      console.error(`[calculateBrandSettlement] 에러 메시지:`, error?.message);
      console.error(`[calculateBrandSettlement] 에러 스택:`, error?.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`정산 생성 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`);
    }
  }

  // 브랜드별 정산 조회
  async findBrandSettlements(brandId: string): Promise<Settlement[]> {
    return this.settlementRepository.find({
      where: { brandId },
      order: { settlementMonth: 'DESC' },
    });
  }

  // 해당 년월에 주문이 있는 브랜드 목록 조회
  async getBrandsWithOrders(year: number, month: number): Promise<any[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // 해당 기간에 totalAmount > 0인 주문이 있는 브랜드 조회
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('product.brandEntity', 'brand')
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('order.totalAmount > 0')
      .getMany();
    
    // 브랜드별로 그룹화하여 중복 제거
    const brandMap = new Map<string, any>();
    
    for (const order of orders) {
      if (order.orderItems && order.orderItems.length > 0) {
        for (const item of order.orderItems) {
          if (item.product?.brandEntity) {
            const brandId = item.product.brandEntity.id;
            if (!brandMap.has(brandId)) {
              brandMap.set(brandId, {
                id: item.product.brandEntity.id,
                name: item.product.brandEntity.name,
              });
            }
          }
        }
      }
    }
    
    return Array.from(brandMap.values());
  }

  // FC-003: 정산 확정 처리 (지급 예정 상태로 변경)
  async confirmSettlement(id: string): Promise<SettlementResponseDto> {
    const settlement = await this.findOneEntity(id);
    
    if (settlement.status !== SettlementStatus.PENDING) {
      throw new BadRequestException('정산 대기 상태인 경우에만 확정할 수 있습니다.');
    }
    
    settlement.status = SettlementStatus.PAYMENT_SCHEDULED;
    
    const updatedSettlement = await this.settlementRepository.save(settlement);
    
    return this.findOne(id);
  }

  // FC-004: 지급 완료 처리
  async completePayment(id: string): Promise<SettlementResponseDto> {
    const settlement = await this.findOneEntity(id);
    
    if (settlement.status !== SettlementStatus.PAYMENT_SCHEDULED) {
      throw new BadRequestException('지급 예정 상태인 경우에만 지급 완료 처리할 수 있습니다.');
    }
    
    settlement.status = SettlementStatus.COMPLETED;
    settlement.settledAt = new Date();
    
    const updatedSettlement = await this.settlementRepository.save(settlement);
    
    return this.findOne(id);
  }

  // 브랜드별 정산 완료 처리 메서드 수정
  async completeBrandSettlement(id: string): Promise<SettlementResponseDto> {
    const settlement = await this.findOneEntity(id);
    
    settlement.status = SettlementStatus.COMPLETED;
    settlement.settledAt = new Date();
    
    const updatedSettlement = await this.settlementRepository.save(settlement);
    
    return new SettlementResponseDto({
      id: updatedSettlement.id,
      settlementMonth: updatedSettlement.settlementMonth,
      totalSales: updatedSettlement.totalSales,
      commissionRate: updatedSettlement.commissionRate,
      commissionAmount: updatedSettlement.commissionAmount,
      actualSettlementAmount: updatedSettlement.actualSettlementAmount,
      status: updatedSettlement.status,
      bank: updatedSettlement.bank,
      accountNumber: updatedSettlement.accountNumber,
      accountHolder: updatedSettlement.accountHolder,
      settledAt: updatedSettlement.settledAt,
      createdAt: updatedSettlement.createdAt,
      updatedAt: updatedSettlement.updatedAt
    });
  }
} 