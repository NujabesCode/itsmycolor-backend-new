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

    if (year && month) {
      queryBuilder.andWhere('settlement.settlementMonth = :settlementMonth', {
        settlementMonth: `${year}-${month.toString().padStart(2, '0')}`,
      });
    }

    // FC-001: 기간 필터 추가
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('settlement.createdAt BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      });
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
    const settlementMonth = `${targetYear2}-${targetMonth.toString().padStart(2, '0')}`;
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
    year: number,
    month: number,
    commissionRate: number = 12,
  ): Promise<SettlementResponseDto> {
    // 해당 월의 시작일과 종료일 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const settlementMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    // 해당 브랜드의 해당 월 정산이 이미 있는지 확인
    const existingSettlement = await this.settlementRepository.findOne({
      where: { brandId, settlementMonth },
    });
    
    if (existingSettlement) {
      throw new BadRequestException(`${settlementMonth} 기간의 ${brandId} 브랜드 정산이 이미 존재합니다.`);
    }
    
    // 해당 브랜드의 해당 기간 내 주문 조회
    const { orders } = await this.ordersService.findByBrandId(brandId, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 10000, // 모든 주문 조회
    });
    
    // totalAmount > 0인 주문만 필터링
    const filteredOrders = orders.filter(order => order.totalAmount && order.totalAmount > 0);
    
    console.log(`[calculateBrandSettlement] 브랜드 ${brandId}, ${settlementMonth} 기간 내 주문 수:`, filteredOrders.length);
    
    if (filteredOrders.length === 0) {
      throw new BadRequestException(`${settlementMonth} 기간에 ${brandId} 브랜드의 정산할 주문이 없습니다.`);
    }
    
    // 총 매출 계산
    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
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
    
    const savedSettlement = await this.settlementRepository.save(settlement);
    
    // 저장된 정산을 다시 조회하여 브랜드 정보 포함
    // save()는 단일 엔티티를 반환하지만 타입 추론 문제로 인해 명시적 타입 단언 사용
    const settlementEntity = Array.isArray(savedSettlement) ? savedSettlement[0] : savedSettlement;
    const settlementWithBrand = await this.settlementRepository.findOne({
      where: { id: settlementEntity.id },
      relations: ['brand'],
    });
    
    if (!settlementWithBrand) {
      throw new NotFoundException('정산 생성 후 조회에 실패했습니다.');
    }
    
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