import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CSInquiry,
  InquiryStatus,
  InquiryType,
} from './entities/cs-inquiry.entity';
import {
  CreateCSInquiryDto,
  UpdateCSInquiryDto,
  CSInquiryResponseDto,
} from './dto/cs-inquiry.dto';
import { OrdersService } from '../orders.service';

@Injectable()
export class CSManagementService {
  constructor(
    @InjectRepository(CSInquiry)
    private csInquiryRepository: Repository<CSInquiry>,
    private ordersService: OrdersService,
  ) {}

  async create(
    createCSInquiryDto: CreateCSInquiryDto,
    userId: string,
  ): Promise<CSInquiryResponseDto> {
    // 문의번호 생성
    const inquiryNumber = `CS${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 주문 ID가 제공된 경우 주문 존재 여부 확인
    if (createCSInquiryDto.orderId) {
      try {
        await this.ordersService.findOne(createCSInquiryDto.orderId, userId);
      } catch (error) {
        throw new NotFoundException('해당 주문을 찾을 수 없습니다.');
      }
    }

    const csInquiry = this.csInquiryRepository.create({
      ...createCSInquiryDto,
      inquiryNumber,
      userId,
      status: InquiryStatus.PENDING,
    });

    const savedInquiry = await this.csInquiryRepository.save(csInquiry);

    return this.findOne(savedInquiry.id, userId);
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    type?: InquiryType;
    status?: string;
  }): Promise<{
    inquiries: CSInquiryResponseDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const { page = 1, limit = 10, type, status } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.csInquiryRepository
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.user', 'user')
      .leftJoinAndSelect('inquiry.order', 'order')
      .select(['inquiry', 'user.id', 'user.name', 'user.email', 'order.id']);

    if (type) {
      queryBuilder.andWhere('inquiry.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('inquiry.status = :status', { status });
    }

    queryBuilder.orderBy('inquiry.createdAt', 'DESC');

    const [inquiries, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const lastPage = Math.ceil(total / limit);

    return {
      inquiries: inquiries.map((inquiry) => this.mapToResponseDto(inquiry)),
      total,
      page,
      lastPage,
    };
  }

  async findByUserId(
    userId: string,
    options: { page?: number; limit?: number },
  ): Promise<{
    inquiries: CSInquiryResponseDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.csInquiryRepository
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.order', 'order')
      .where('inquiry.userId = :userId', { userId })
      .select(['inquiry', 'order.id']);

    queryBuilder.orderBy('inquiry.createdAt', 'DESC');

    const [inquiries, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const lastPage = Math.ceil(total / limit);

    return {
      inquiries: inquiries.map((inquiry) => this.mapToResponseDto(inquiry)),
      total,
      page,
      lastPage,
    };
  }

  async findOne(id: string, userId?: string): Promise<CSInquiryResponseDto> {
    const queryBuilder = this.csInquiryRepository
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.user', 'user')
      .leftJoinAndSelect('inquiry.order', 'order')
      .where('inquiry.id = :id', { id })
      .select(['inquiry', 'user.id', 'user.name', 'user.email', 'order.id']);

    const inquiry = await queryBuilder.getOne();

    if (!inquiry) {
      throw new NotFoundException(`문의 ID ${id}를 찾을 수 없습니다.`);
    }

    // 관리자가 아닌 경우 본인 문의만 조회 가능
    if (userId && inquiry.userId !== userId) {
      // 여기서는 간단히 처리, 실제로는 관리자 여부 체크 로직 필요
      const adminEmails = ['admin@itsmycolor.com', 'hanatien@gmail.com'];
      const user = inquiry.user;
      if (!user || !adminEmails.includes(user.email)) {
        throw new ForbiddenException(
          '다른 사용자의 문의를 조회할 권한이 없습니다.',
        );
      }
    }

    return this.mapToResponseDto(inquiry);
  }

  async updateAnswer(
    id: string,
    updateCSInquiryDto: UpdateCSInquiryDto,
  ): Promise<CSInquiryResponseDto> {
    const inquiry = await this.csInquiryRepository.findOne({ where: { id } });

    if (!inquiry) {
      throw new NotFoundException(`문의 ID ${id}를 찾을 수 없습니다.`);
    }

    // 답변 등록 시 answeredAt 업데이트
    if (updateCSInquiryDto.answer && !inquiry.answer) {
      inquiry.answeredAt = new Date();
    }

    // 답변 등록 시 상태 자동 업데이트
    if (updateCSInquiryDto.answer) {
      inquiry.status = InquiryStatus.COMPLETED;
    }

    const updatedInquiry = await this.csInquiryRepository.save({
      ...inquiry,
      ...updateCSInquiryDto,
    });

    return this.findOne(id);
  }

  async findByBrandId(
    brandId: string,
    options: {
      page?: number;
      limit?: number;
      type?: InquiryType;
      status?: string;
    },
  ): Promise<{
    inquiries: CSInquiryResponseDto[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const { page = 1, limit = 10, type, status } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.csInquiryRepository
      .createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.order', 'order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoin('orderItems.product', 'product')
      .where('product.brandId = :brandId', { brandId });

    // 필터링 조건 적용
    if (type) {
      queryBuilder.andWhere('inquiry.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('inquiry.status = :status', { status });
    }

    queryBuilder.orderBy('inquiry.createdAt', 'DESC');

    const [inquiries, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const lastPage = Math.ceil(total / limit);

    return {
      inquiries: inquiries.map((inquiry) => this.mapToResponseDto(inquiry)),
      total,
      page,
      lastPage,
    };
  }

  private mapToResponseDto(inquiry: CSInquiry): CSInquiryResponseDto {
    const response = new CSInquiryResponseDto({
      id: inquiry.id,
      inquiryNumber: inquiry.inquiryNumber,
      type: inquiry.type,
      title: inquiry.title,
      content: inquiry.content,
      status: inquiry.status,
      answer: inquiry.answer,
      answeredAt: inquiry.answeredAt,
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.updatedAt,
    });

    if (inquiry.user) {
      response.user = {
        id: inquiry.user.id,
        name: inquiry.user.name,
        email: inquiry.user.email,
      };
    }

    if (inquiry.order) {
      response.order = {
        id: inquiry.order.id,
      };
    }

    return response;
  }
}
