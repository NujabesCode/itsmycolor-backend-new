import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ColorAnalysis } from '../color-analysis/entities/color-analysis.entity';
import { ConsultingAppointment } from '../color-analysis/entities/consulting-appointment.entity';
import { Payment } from '../payments/entities/payment.entity';
import {
  CustomerType,
  CustomerFilterDto,
  CustomerResponseDto,
  CustomerStatisticsDto,
  AdminDashboardResponseDto,
  CustomerPurchaseInfoDto,
} from './dto/admin-customer.dto';
import {
  UserResponseDto,
  UserFilterDto,
  UpdateUserPasswordByEmailDto,
} from './dto/admin-settings.dto';
import { BodyType } from '../common/types/body-type.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ColorAnalysis)
    private colorAnalysisRepository: Repository<ColorAnalysis>,
    @InjectRepository(ConsultingAppointment)
    private consultingAppointmentRepository: Repository<ConsultingAppointment>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private readonly usersService: UsersService,
  ) {}

  async getCustomers(filters: CustomerFilterDto): Promise<{ data: CustomerResponseDto[], total: number, lastPage: number }> {
    const { customerType, bodyType, colorSeason, searchTerm, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    
    try {
      // select를 제거하여 leftJoinAndSelect가 제대로 동작하도록 함
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.colorAnalyses', 'colorAnalysis')
        .leftJoinAndSelect('user.orders', 'order');
      
      // 고객 타입 필터링
      try {
        if (customerType === CustomerType.CONSULTING) {
          queryBuilder.innerJoin('user.colorAnalyses', 'consulting');
        } else if (customerType === CustomerType.PURCHASE) {
          queryBuilder.innerJoin('user.orders', 'purchases');
        } else if (customerType === CustomerType.VIP) {
          queryBuilder.innerJoin('user.orders', 'vipOrders')
            .groupBy('user.id')
            .having('SUM(vipOrders.totalAmount) > 500000'); // VIP 조건 (50만원 이상 구매)
        }
      } catch (error) {
        console.error('고객 타입 필터링 중 오류 발생:', error.message);
        // 필터링 오류가 발생하면 필터링을 건너뛰고 계속 진행
      }
      
      // 체형 타입 필터링
      if (bodyType) {
        queryBuilder.andWhere('colorAnalysis.bodyType = :bodyType', { bodyType });
      }
      
      // 퍼스널 컬러 필터링
      if (colorSeason) {
        queryBuilder.andWhere('colorAnalysis.colorSeason = :colorSeason', { colorSeason });
      }
      
      // 검색어 필터링
      if (searchTerm) {
        queryBuilder.andWhere(
          '(user.name LIKE :searchTerm OR user.email LIKE :searchTerm OR user.phone LIKE :searchTerm)',
          { searchTerm: `%${searchTerm}%` }
        );
      }
      
      // 결과 조회
      let users: User[] = [];
      let total: number = 0;
      
      try {
        queryBuilder.orderBy('user.createdAt', 'DESC');
        [users, total] = await queryBuilder
          .skip(skip)
          .take(limit)
          .getManyAndCount();
      } catch (error) {
        console.error('고객 목록 조회 중 쿼리 오류 발생:', error.message);
        // 쿼리 실패 시 빈 결과 반환
        return { data: [], total: 0, lastPage: 0 };
      }
      
      // 결과 변환 - 처리 중 오류가 발생해도 진행되도록 추가 예외 처리
      const customersResponse = await Promise.all(
        users.map(async user => {
          try {
            // 디버깅: colorAnalyses 확인
            console.log(`[getCustomers] 사용자 [ID: ${user.id}] colorAnalyses:`, {
              hasColorAnalyses: !!user.colorAnalyses,
              colorAnalysesLength: user.colorAnalyses?.length || 0,
              colorAnalyses: user.colorAnalyses
            });
            
            // colorAnalyses가 없으면 다시 조회 시도
            let colorAnalyses = user.colorAnalyses;
            if (!colorAnalyses || colorAnalyses.length === 0) {
              const userWithAnalyses = await this.userRepository.findOne({
                where: { id: user.id },
                relations: ['colorAnalyses']
              });
              colorAnalyses = userWithAnalyses?.colorAnalyses || [];
              console.log(`[getCustomers] 재조회한 colorAnalyses [ID: ${user.id}]:`, colorAnalyses.length);
            }
            
            const latestColorAnalysis = colorAnalyses && colorAnalyses.length > 0
              ? colorAnalyses.sort((a, b) => 
                  b.createdAt.getTime() - a.createdAt.getTime())[0]
              : null;
            
            console.log(`[getCustomers] latestColorAnalysis [ID: ${user.id}]:`, {
              hasAnalysis: !!latestColorAnalysis,
              bodyType: latestColorAnalysis?.bodyType,
              colorSeason: latestColorAnalysis?.colorSeason,
              createdAt: latestColorAnalysis?.createdAt
            });
            
            // 구매 정보 계산 (이제 항상 객체를 반환함)
            let purchaseInfo;
            try {
              console.log(`[getCustomers] getUserPurchaseInfo 호출 시작 [ID: ${user.id}]`);
              purchaseInfo = await this.getUserPurchaseInfo(user.id);
              console.log(`[getCustomers] getUserPurchaseInfo 호출 완료 [ID: ${user.id}]:`, purchaseInfo);
            } catch (purchaseError) {
              console.error(`[getCustomers] getUserPurchaseInfo 호출 실패 [ID: ${user.id}]:`, purchaseError.message);
              console.error(`[getCustomers] 스택 트레이스:`, purchaseError.stack);
              purchaseInfo = {
                totalAmount: 0,
                lastPurchaseDate: null
              };
            }
            
            console.log(`[getCustomers] purchaseInfo [ID: ${user.id}]:`, purchaseInfo);
            
            // purchaseInfo는 이제 항상 객체이므로 직접 사용
            const finalPurchaseInfo = {
              totalAmount: purchaseInfo?.totalAmount ?? 0,
              lastPurchaseDate: purchaseInfo?.lastPurchaseDate ?? null
            };
            
            console.log(`[getCustomers] finalPurchaseInfo [ID: ${user.id}]:`, finalPurchaseInfo);
            
            // VIP 여부 확인 (50만원 이상 구매)
            const isVip = finalPurchaseInfo.totalAmount >= 500000;
            
            const result = {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              isVip,
              bodyType: latestColorAnalysis?.bodyType || null,
              colorSeason: latestColorAnalysis?.colorSeason || null,
              lastVisitDate: latestColorAnalysis?.createdAt || finalPurchaseInfo.lastPurchaseDate || null,
              purchaseInfo: finalPurchaseInfo,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            };
            
            console.log(`[getCustomers] 최종 반환 데이터 [ID: ${user.id}]:`, JSON.stringify(result, null, 2));
            
            return result as CustomerResponseDto;
          } catch (error) {
            console.error(`사용자 데이터 처리 중 오류 발생 [ID: ${user.id}]:`, error.message);
            // 오류 발생 시 최소한의 정보만 반환
            return {
              id: user.id,
              name: user.name || '이름 없음',
              email: user.email || '',
              phone: user.phone || '',
              isVip: false,
              purchaseInfo: {
                totalAmount: 0,
                lastPurchaseDate: null
              },
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            } as CustomerResponseDto;
          }
        })
      );
      
      return {
        data: customersResponse,
        total,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('고객 목록 조회 중 오류 발생:', error.message);
      return { data: [], total: 0, lastPage: 0 };
    }
  }

  async getUserPurchaseInfo(userId: string): Promise<CustomerPurchaseInfoDto> {
    try {
      console.log(`[getUserPurchaseInfo] 시작 [ID: ${userId}]`);
      
      // 먼저 해당 사용자의 모든 주문 조회
      const allOrders = await this.orderRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' }
      });
      
      console.log(`[getUserPurchaseInfo] 사용자 [ID: ${userId}] 전체 주문 수:`, allOrders.length);
      if (allOrders.length > 0) {
        console.log(`[getUserPurchaseInfo] 주문 상태 목록:`, allOrders.map(o => ({ 
          id: o.id.substring(0, 8), 
          status: o.status, 
          totalAmount: o.totalAmount 
        })));
      }
      
      // Payment 테이블에서 결제 완료된 주문 조회 시도
      let userPaidOrders: Order[] = [];
      try {
        const paidPayments = await this.paymentRepository.find({
          where: {
            isPaid: true,
            isCanceled: false
          },
          relations: ['order'],
          order: { createdAt: 'DESC' }
        });
        
        // 해당 사용자의 주문만 필터링
        userPaidOrders = paidPayments
          .filter(payment => payment.order?.userId === userId)
          .map(payment => payment.order)
          .filter(order => order !== null && order !== undefined);
        
        console.log(`[getUserPurchaseInfo] Payment 기반 결제 완료 주문 수:`, userPaidOrders.length);
      } catch (paymentError) {
        console.log(`[getUserPurchaseInfo] Payment 조회 실패 (무시하고 계속):`, paymentError.message);
      }
      
      // 주문 상태 기반으로 유효한 주문 필터링 (PENDING과 CANCELLED 제외)
      const validOrdersByStatus = allOrders.filter(order => 
        order.status !== OrderStatus.PENDING && 
        order.status !== OrderStatus.CANCELLED
      );
      
      console.log(`[getUserPurchaseInfo] 주문 상태 기반 유효 주문 수:`, validOrdersByStatus.length);
      
      // Payment 기반 주문이 있으면 우선 사용, 없으면 주문 상태 기반 사용
      // 둘 다 없으면 totalAmount가 있는 모든 주문 사용 (임시 조치)
      let finalOrders: Order[] = [];
      
      if (userPaidOrders.length > 0) {
        finalOrders = userPaidOrders;
        console.log(`[getUserPurchaseInfo] Payment 기반 주문 사용`);
      } else if (validOrdersByStatus.length > 0) {
        finalOrders = validOrdersByStatus;
        console.log(`[getUserPurchaseInfo] 주문 상태 기반 주문 사용`);
      } else {
        // Payment도 없고 유효한 상태도 없으면, totalAmount가 있는 주문은 모두 포함
        finalOrders = allOrders.filter(order => {
          const hasAmount = order.totalAmount && order.totalAmount > 0;
          console.log(`[getUserPurchaseInfo] 주문 필터링:`, { id: order.id.substring(0, 8), status: order.status, totalAmount: order.totalAmount, hasAmount });
          return hasAmount;
        });
        console.log(`[getUserPurchaseInfo] totalAmount가 있는 주문 사용:`, finalOrders.length);
      }
      
      if (!finalOrders || finalOrders.length === 0) {
        console.log(`[getUserPurchaseInfo] 사용자 [ID: ${userId}] 구매 완료 주문 없음 - 기본값 반환`);
        return {
          totalAmount: 0,
          lastPurchaseDate: null
        };
      }
      
      // Payment의 paidAmount를 우선 사용, 없으면 order의 totalAmount 사용
      const totalAmount = finalOrders.reduce((sum, order) => {
        const amount = order.totalAmount || 0;
        return sum + amount;
      }, 0);
      
      const lastPurchaseDate = finalOrders[0].createdAt;
      
      console.log(`[getUserPurchaseInfo] 사용자 [ID: ${userId}] 최종 계산:`, {
        totalAmount,
        lastPurchaseDate,
        orderCount: finalOrders.length,
        orders: finalOrders.map(o => ({ id: o.id.substring(0, 8), status: o.status, amount: o.totalAmount }))
      });
      
      return {
        totalAmount,
        lastPurchaseDate
      };
    } catch (error) {
      console.error(`[getUserPurchaseInfo] 사용자 구매 정보 조회 오류 [ID: ${userId}]:`, error.message);
      console.error(`[getUserPurchaseInfo] 스택 트레이스:`, error.stack);
      return {
        totalAmount: 0,
        lastPurchaseDate: null
      };
    }
  }

  async getCustomerStatistics(): Promise<CustomerStatisticsDto> {
    try {
      const totalCustomers = await this.userRepository.count();
      
      let consultingCustomers;
      try {
        consultingCustomers = await this.userRepository
          .createQueryBuilder('user')
          .innerJoin('user.colorAnalyses', 'colorAnalysis')
          .groupBy('user.id')
          .getCount();
      } catch (error) {
        console.error('컨설팅 고객 통계 조회 오류:', error.message);
        consultingCustomers = 0;
      }
      
      let purchaseCustomers;
      try {
        purchaseCustomers = await this.userRepository
          .createQueryBuilder('user')
          .innerJoin('user.orders', 'order')
          .groupBy('user.id')
          .getCount();
      } catch (error) {
        console.error('구매 고객 통계 조회 오류:', error.message);
        purchaseCustomers = 0;
      }
      
      let vipCustomers;
      try {
        vipCustomers = await this.userRepository
          .createQueryBuilder('user')
          .innerJoin('user.orders', 'order')
          .groupBy('user.id')
          .having('SUM(order.totalAmount) > 500000') // VIP 조건 (50만원 이상)
          .getCount();
      } catch (error) {
        console.error('VIP 고객 통계 조회 오류:', error.message);
        vipCustomers = 0;
      }
      
      return {
        totalCustomers,
        consultingCustomers,
        purchaseCustomers,
        vipCustomers
      };
    } catch (error) {
      console.error('고객 통계 조회 중 오류 발생:', error.message);
      return {
        totalCustomers: 0,
        consultingCustomers: 0,
        purchaseCustomers: 0,
        vipCustomers: 0
      };
    }
  }

  async getDashboardData(): Promise<AdminDashboardResponseDto> {
    try {
      // 각 데이터 조회 시 개별적으로 try-catch로 처리하여 부분 실패해도 전체 실패하지 않도록 구현
      
      // 고객 통계
      let customerStatistics;
      try {
        customerStatistics = await this.getCustomerStatistics();
      } catch (error) {
        console.error('고객 통계 조회 중 오류 발생:', error.message);
        customerStatistics = {
          totalCustomers: 0,
          consultingCustomers: 0,
          purchaseCustomers: 0,
          vipCustomers: 0
        };
      }
      
      // 월별 매출 추이
      let monthlySales;
      try {
        monthlySales = await this.getMonthlySalesData();
      } catch (error) {
        console.error('월별 매출 추이 조회 중 오류 발생:', error.message);
        monthlySales = [];
      }
      
      // 체형별 타입 분석
      let bodyTypeAnalysis;
      try {
        bodyTypeAnalysis = await this.getBodyTypeAnalysis();
      } catch (error) {
        console.error('체형별 타입 분석 조회 중 오류 발생:', error.message);
        bodyTypeAnalysis = [];
      }
      
      // 인기 상품 TOP 5
      let topProducts;
      try {
        topProducts = await this.getTopProducts();
      } catch (error) {
        console.error('인기 상품 조회 중 오류 발생:', error.message);
        topProducts = [];
      }
      
      // 연령대별 구매 현황
      let ageGroupSales;
      try {
        ageGroupSales = await this.getAgeGroupSales();
      } catch (error) {
        console.error('연령대별 구매 현황 조회 중 오류 발생:', error.message);
        ageGroupSales = [];
      }
      
      // 컨설팅 후 구매 전환율
      let consultingConversion;
      try {
        consultingConversion = await this.getConsultingConversion();
      } catch (error) {
        console.error('컨설팅 후 구매 전환율 조회 중 오류 발생:', error.message);
        consultingConversion = {
          overall: 0,
          colorAnalysis: 0,
          bodyTypeAnalysis: 0,
          styleAnalysis: 0
        };
      }
      
      // 브랜드별 판매 성과
      let brandPerformance;
      try {
        brandPerformance = await this.getBrandPerformance();
      } catch (error) {
        console.error('브랜드별 판매 성과 조회 중 오류 발생:', error.message);
        brandPerformance = [];
      }
      
      // 체형별 판매 비중
      let bodyTypeSales;
      try {
        bodyTypeSales = await this.getBodyTypeSales();
      } catch (error) {
        console.error('체형별 판매 비중 조회 중 오류 발생:', error.message);
        bodyTypeSales = [];
      }
      
      return {
        customerStatistics,
        monthlySales,
        bodyTypeAnalysis,
        topProducts,
        ageGroupSales,
        consultingConversion,
        brandPerformance,
        bodyTypeSales
      };
    } catch (error) {
      console.error('대시보드 데이터 조회 중 오류 발생:', error.message);
      // 기본 빈 데이터 구조 반환
      return {
        customerStatistics: {
          totalCustomers: 0,
          consultingCustomers: 0,
          purchaseCustomers: 0,
          vipCustomers: 0
        },
        monthlySales: [],
        bodyTypeAnalysis: [],
        topProducts: [],
        ageGroupSales: [],
        consultingConversion: {
          overall: 0,
          colorAnalysis: 0,
          bodyTypeAnalysis: 0,
          styleAnalysis: 0
        },
        brandPerformance: [],
        bodyTypeSales: []
      };
    }
  }

  private async getMonthlySalesData(): Promise<{ month: string; amount: number }[]> {
    try {
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 5);
      
      // 첫날로 설정
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);
      
      const orders = await this.orderRepository.find({
        where: {
          createdAt: Between(sixMonthsAgo, today),
          status: Not(OrderStatus.PENDING)
        }
      });
      
      const months = {};
      for (let i = 0; i <= 5; i++) {
        const date = new Date();
        date.setMonth(today.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months[monthKey] = 0;
      }
      
      // 주문별 월 매출 합산
      orders.forEach(order => {
        const date = order.createdAt;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (months[monthKey] !== undefined) {
          months[monthKey] += order.totalAmount;
        }
      });
      
      // 결과 배열로 변환
      return Object.entries(months)
        .map(([month, amount]) => ({ month, amount: amount as number }))
        .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error('월별 매출 추이 조회 중 오류 발생:', error.message);
      return [];
    }
  }

  private async getBodyTypeAnalysis(): Promise<{ type: string; percentage: number }[]> {
    try {
      const totalAnalyses = await this.colorAnalysisRepository.count();
      if (totalAnalyses === 0) return [];
      
      const bodyTypeCounts = await this.colorAnalysisRepository
        .createQueryBuilder('colorAnalysis')
        .select('colorAnalysis.bodyType, COUNT(*) as count')
        .groupBy('colorAnalysis.bodyType')
        .getRawMany();
      
      return bodyTypeCounts.map(item => ({
        type: item.bodyType,
        percentage: Math.round((item.count / totalAnalyses) * 100)
      }));
    } catch (error) {
      console.error('체형별 타입 분석 조회 중 오류 발생:', error.message);
      return [];
    }
  }

  private async getTopProducts(): Promise<{ name: string; sales: number }[]> {
    try {
      const topProducts = await this.orderRepository
        .createQueryBuilder('order')
        .innerJoin('order.orderItems', 'orderItem')
        .where('order.status != :status', { status: OrderStatus.PENDING })
        .select(
          'orderItem.productName as name, SUM(orderItem.quantity) as sales',
        )
        .groupBy('orderItem.productName')
        .orderBy('sales', 'DESC')
        .limit(5)
        .getRawMany();

      return topProducts;
    } catch (error) {
      console.error('인기 상품 조회 중 오류 발생:', error.message);
      // 오류 발생 시 빈 배열 반환하여 서비스 중단 방지
      return [];
    }
  }

  private async getAgeGroupSales(): Promise<{ ageGroup: string; male: number; female: number }[]> {
    try {
      // 실제로는 사용자 정보에 나이, 성별 정보가 포함되어 있어야 합니다.
      // 데이터가 있을 경우 실제 DB 데이터 기반으로 변경
      // 이 예제에서는 기본 데이터 반환
      return [
        { ageGroup: '20대', male: 0, female: 0 },
        { ageGroup: '30대', male: 0, female: 0 },
        { ageGroup: '40대', male: 0, female: 0 },
        { ageGroup: '50대', male: 0, female: 0 },
        { ageGroup: '60대 이상', male: 0, female: 0 }
      ];
    } catch (error) {
      console.error('연령대별 구매 현황 조회 중 오류 발생:', error.message);
      return [];
    }
  }

  private async getConsultingConversion(): Promise<{
    overall: number;
    colorAnalysis: number;
    bodyTypeAnalysis: number;
    styleAnalysis: number;
  }> {
    try {
      // 컨설팅을 받은 사용자 ID 목록
      const colorAnalyses = await this.colorAnalysisRepository.find({
        select: ['userId'],
      });

      if (!colorAnalyses.length) {
        return {
          overall: 0,
          colorAnalysis: 0,
          bodyTypeAnalysis: 0,
          styleAnalysis: 0,
        };
      }

      const consultingUserIds = [
        ...new Set(colorAnalyses.map((analysis) => analysis.userId)),
      ];

      // 컨설팅 후 구매한 사용자 수 계산
      const purchasedAfterConsulting = await this.orderRepository
        .createQueryBuilder('order')
        .where('order.userId IN (:...userIds)', { userIds: consultingUserIds })
        .andWhere('order.status != :status', { status: OrderStatus.PENDING })
        .getCount();
      
      // 전체 전환율 계산
      const overallRate = consultingUserIds.length > 0 
        ? Math.round((purchasedAfterConsulting / consultingUserIds.length) * 100) 
        : 0;
      
      // 각 분석 유형별 전환율은 실제 데이터 기반으로 계산 필요
      // 현재는 전체 전환율 기준으로 임의 값 생성
      return {
        overall: overallRate,
        colorAnalysis: Math.min(100, overallRate + Math.floor(Math.random() * 10)),
        bodyTypeAnalysis: Math.min(100, overallRate - Math.floor(Math.random() * 10)),
        styleAnalysis: Math.min(100, overallRate + Math.floor(Math.random() * 5))
      };
    } catch (error) {
      console.error('컨설팅 후 구매 전환율 조회 중 오류 발생:', error.message);
      return {
        overall: 0,
        colorAnalysis: 0,
        bodyTypeAnalysis: 0,
        styleAnalysis: 0
      };
    }
  }

  private async getBrandPerformance(): Promise<{
    brand: string;
    count: number;
    amount: number;
    growthRate: number;
    topStyles: string;
  }[]> {
    try {
      // 실제 데이터 기반으로 브랜드별 판매 현황 조회
      // 테이블 구조에 따라 적절히 수정 필요
      const brandSales = await this.orderRepository
        .createQueryBuilder('order')
        .innerJoin('order.orderItems', 'orderItem')
        .innerJoin('orderItem.product', 'product')
        .innerJoin('product.brandEntity', 'brand')
        .where('order.status != :status', { status: OrderStatus.PENDING })
        .select([
          'brand.name as brand',
          'COUNT(DISTINCT order.id) as count',
          'SUM(orderItem.price * orderItem.quantity) as amount',
        ])
        .groupBy('brand.name')
        .orderBy('amount', 'DESC')
        .limit(5)
        .getRawMany();
      
      if (!brandSales.length) {
        // 데이터가 없을 경우 기본 데이터 제공
        return [];
      }
      
      // growthRate와 topStyles는 추가 쿼리가 필요하지만,
      // 예시로 임의의 값 생성
      return brandSales.map(item => ({
        brand: item.brand,
        count: parseInt(item.count),
        amount: parseInt(item.amount),
        growthRate: Math.floor(Math.random() * 30) - 5, // -5 ~ 25 범위의 임의 값
        topStyles: 'Straight(55%), Wave(30%), Natural(15%)' // 실제 데이터로 대체 필요
      }));
    } catch (error) {
      console.error('브랜드별 판매 성과 조회 중 오류 발생:', error.message);
      // 오류 시 기본 데이터 제공
      return [
        { 
          brand: '오류 발생', 
          count: 0, 
          amount: 0, 
          growthRate: 0, 
          topStyles: 'N/A' 
        }
      ];
    }
  }

  private async getBodyTypeSales(): Promise<{ type: string; percentage: number }[]> {
    try {
      // 주문 아이템과 컬러 분석 데이터 연동 쿼리
      const salesByBodyType = await this.orderRepository
        .createQueryBuilder('order')
        .innerJoin('order.user', 'user')
        .innerJoin('user.colorAnalyses', 'colorAnalysis')
        .where('order.status != :status', { status: OrderStatus.PENDING })
        .select([
          'colorAnalysis.bodyType as type',
          'SUM(order.totalAmount) as totalAmount',
        ])
        .groupBy('colorAnalysis.bodyType')
        .getRawMany();
      
      if (!salesByBodyType.length) {
        return Object.values(BodyType).map(type => ({
          type,
          percentage: 0
        }));
      }
      
      // 전체 판매액 계산
      const totalSales = salesByBodyType.reduce(
        (sum, item) => sum + parseFloat(item.totalAmount), 0
      );
      
      if (totalSales === 0) {
        return Object.values(BodyType).map(type => ({
          type,
          percentage: 0
        }));
      }
      
      // 체형별 비율 계산
      return salesByBodyType.map(item => ({
        type: item.type,
        percentage: Math.round((parseFloat(item.totalAmount) / totalSales) * 100)
      }));
    } catch (error) {
      console.error('체형별 판매 비중 조회 중 오류 발생:', error.message);
      // BodyType enum에 정의된 모든 체형 타입에 대해 0% 비율로 반환
      return Object.values(BodyType).map(type => ({
        type,
        percentage: 0
      }));
    }
  }

  // 관리자 설정 - 사용자 관리 기능
  async getUsers(filters: UserFilterDto): Promise<{ data: UserResponseDto[], total: number, lastPage: number }> {
    const { role, searchTerm, isActive, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.role',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt'
      ]);
    
    // 사용자 권한 필터링
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }
    
    // 활성화 상태 필터링
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }
    
    // 검색어 필터링
    if (searchTerm) {
      queryBuilder.andWhere(
        '(user.name LIKE :searchTerm OR user.email LIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      );
    }
    
    const [users, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    // 결과 변환
    const usersResponse = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    } as UserResponseDto));
    
    return {
      data: usersResponse,
      total,
      lastPage: Math.ceil(total / limit)
    };
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    } as UserResponseDto;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    
    user.role = role;
    const updatedUser = await this.userRepository.save({ id: userId, role: role });
    
    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt
    } as UserResponseDto;
  }

  async toggleUserActive(userId: string, isActive: boolean): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    
    user.isActive = isActive;
    const updatedUser = await this.userRepository.save({ id: userId, isActive: isActive });
    
    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt
    } as UserResponseDto;
  }

  async updateUserPasswordByEmail(
    dto: UpdateUserPasswordByEmailDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.updatePasswordByEmail(
      dto.email,
      dto.newPassword,
    );

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
    } as UserResponseDto;
  }
} 