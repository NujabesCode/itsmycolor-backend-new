import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnRequest, ReturnStatus } from './entities/return-request.entity';
import { CreateReturnRequestDto, UpdateReturnRequestDto, ReturnRequestResponseDto } from './dto/return-request.dto';
import { OrdersService } from '../orders.service';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(ReturnRequest)
    private returnRequestRepository: Repository<ReturnRequest>,
    private ordersService: OrdersService,
  ) {}

  async create(createReturnRequestDto: CreateReturnRequestDto, userId: string): Promise<ReturnRequestResponseDto> {
    // 주문 및 주문 상품 확인
    const order = await this.ordersService.findOne(createReturnRequestDto.orderId);
    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    // 사용자 권한 확인
    if (order.user.id !== userId) {
      throw new ForbiddenException('본인의 주문만 반품 신청 가능합니다.');
    }

    // 주문 상품 확인
    const orderItem = order.orderItems.find(item => item.id === createReturnRequestDto.orderItemId);
    if (!orderItem) {
      throw new NotFoundException('주문 상품을 찾을 수 없습니다.');
    }

    // 반품 신청 번호 생성 (예: RT-yyyyMMdd-0001)
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 오늘 생성된 반품 요청의 마지막 번호 확인
    const latestReturnRequest = await this.returnRequestRepository
      .createQueryBuilder('returnRequest')
      .where('returnRequest.returnNumber LIKE :prefix', { prefix: `RT-${dateString}-%` })
      .orderBy('returnRequest.returnNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (latestReturnRequest) {
      const lastSequence = parseInt(latestReturnRequest.returnNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const returnNumber = `RT-${dateString}-${sequence.toString().padStart(4, '0')}`;

    // 반품 요청 생성
    const returnRequest = this.returnRequestRepository.create({
      ...createReturnRequestDto,
      returnNumber,
      status: ReturnStatus.REQUESTED,
      user: { id: userId } as any, // 사용자 정보 연결
    });

    const savedReturnRequest = await this.returnRequestRepository.save(returnRequest);
    return this.findOne(savedReturnRequest.id);
  }

  async findAll(options: { page?: number; limit?: number; status?: ReturnStatus; userId?: string }): Promise<{ data: ReturnRequestResponseDto[]; total: number }> {
    const { page = 1, limit = 10, status, userId } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.returnRequestRepository
      .createQueryBuilder('returnRequest')
      .leftJoinAndSelect('returnRequest.user', 'user')
      .leftJoinAndSelect('returnRequest.order', 'order')
      .leftJoinAndSelect('returnRequest.orderItem', 'orderItem');

    if (status) {
      queryBuilder.where('returnRequest.status = :status', { status });
    }
    
    // 특정 사용자의 반품 요청만 조회
    if (userId) {
      const condition = status ? 'andWhere' : 'where';
      queryBuilder[condition]('user.id = :userId', { userId });
    }

    const [returnRequests, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('returnRequest.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: returnRequests.map(returnRequest => this.toResponseDto(returnRequest)),
      total,
    };
  }

  async findOne(id: string): Promise<ReturnRequestResponseDto> {
    const returnRequest = await this.returnRequestRepository.findOne({
      where: { id },
      relations: ['user', 'order', 'orderItem'],
    });

    if (!returnRequest) {
      throw new NotFoundException('반품 요청을 찾을 수 없습니다.');
    }

    return this.toResponseDto(returnRequest);
  }

  async findByBrandId(brandId: string) {
    const returnRequests = await this.returnRequestRepository
      .createQueryBuilder('returnRequest')
      .leftJoinAndSelect('returnRequest.user', 'user')
      .leftJoinAndSelect('returnRequest.order', 'order')
      .leftJoinAndSelect('returnRequest.orderItem', 'orderItem')
      .leftJoin('orderItem.product', 'product')
      .where('product.brandId = :brandId', { brandId })
      .getMany();

    return returnRequests.map(returnRequest => this.toResponseDto(returnRequest));
  }

  async update(id: string, updateReturnRequestDto: UpdateReturnRequestDto, userId?: string): Promise<ReturnRequestResponseDto> {
    const returnRequest = await this.returnRequestRepository.findOne({
      where: { id },
      relations: ['user', 'order', 'orderItem'],
    });

    if (!returnRequest) {
      throw new NotFoundException('반품 요청을 찾을 수 없습니다.');
    }

    // 권한 확인 (관리자는 제외, 일반 사용자는 본인의 요청만 수정 가능)
    if (userId && returnRequest.user && returnRequest.user.id !== userId) {
      throw new ForbiddenException('본인의 반품 요청만 수정 가능합니다.');
    }

    // 상태 변경 이력 저장
    if (updateReturnRequestDto.status) {
      if (updateReturnRequestDto.status === ReturnStatus.APPROVED) {
        returnRequest.approvedAt = new Date();
      } else if (updateReturnRequestDto.status === ReturnStatus.COMPLETED) {
        returnRequest.completedAt = new Date();
      } else if (updateReturnRequestDto.status === ReturnStatus.REJECTED) {
        returnRequest.rejectedAt = new Date();
      }
    }

    // 환불 완료 시간 저장
    if (updateReturnRequestDto.refundAmount && !returnRequest.refundedAt) {
      returnRequest.refundedAt = new Date();
    }

    Object.assign(returnRequest, updateReturnRequestDto);
    const updatedReturnRequest = await this.returnRequestRepository.save(returnRequest);
    return this.toResponseDto(updatedReturnRequest);
  }

  private toResponseDto(returnRequest: ReturnRequest): ReturnRequestResponseDto {
    return {
      id: returnRequest.id,
      returnNumber: returnRequest.returnNumber,
      status: returnRequest.status,
      reason: returnRequest.reason,
      detailReason: returnRequest.detailReason,
      approvedAt: returnRequest.approvedAt,
      completedAt: returnRequest.completedAt,
      rejectedAt: returnRequest.rejectedAt,
      rejectReason: returnRequest.rejectReason,
      returnTrackingNumber: returnRequest.returnTrackingNumber,
      refundBank: returnRequest.refundBank,
      refundAccountNumber: returnRequest.refundAccountNumber,
      refundAccountHolder: returnRequest.refundAccountHolder,
      refundAmount: returnRequest.refundAmount,
      refundedAt: returnRequest.refundedAt,
      user: returnRequest.user ? {
        id: returnRequest.user.id,
        name: returnRequest.user.name,
        email: returnRequest.user.email,
      } : undefined,
      order: returnRequest.order,
      orderItem: returnRequest.orderItem,
      createdAt: returnRequest.createdAt,
      updatedAt: returnRequest.updatedAt,
    };
  }
} 