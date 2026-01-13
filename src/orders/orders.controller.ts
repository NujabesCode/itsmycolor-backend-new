import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { BrandGuard } from '../auth/guards/brand.guard';
import { UpdateManyOrderStatusDto } from './dto/update-many-order-status.dto';

@ApiTags('주문')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '주문 생성' })
  @ApiResponse({ 
    status: 201, 
    description: '주문 생성 완료', 
    type: OrderDetailResponseDto 
  })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: User,
  ) {
    return this.ordersService.create(createOrderDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 주문 목록 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '주문 목록 반환', 
    type: [OrderResponseDto] 
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 주문 수' })
  @ApiQuery({ name: 'status', required: false, description: '주문 상태' })
  @ApiQuery({ name: 'search', required: false, description: '검색어' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작일' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료일' })
  async findAll(
    @GetUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.findByUserId(user.id, { page, limit, status, search, startDate, endDate });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '주문 상세 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '주문 상세 정보 반환', 
    type: OrderDetailResponseDto 
  })
  @ApiParam({ name: 'id', description: '주문 ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.ordersService.findOne(id, user.id);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '관리자용 모든 주문 목록 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '모든 주문 목록 반환', 
    type: [OrderResponseDto] 
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 주문 수' })
  @ApiQuery({ name: 'status', required: false, description: '주문 상태' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'search', required: false, description: '주문번호 검색' })
  async findAllForAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAll({ page, limit, status, startDate, endDate, search });
  }

  @Get('brands/:brandId')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 주문 조회 (브랜드 관리자용)' })
  @ApiResponse({ status: 200, description: '주문 목록 반환', type: [OrderResponseDto] })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  @ApiQuery({ name: 'status', required: false, description: '주문 상태' })
  @ApiQuery({ name: 'statuses[]', required: false, description: '주문 상태 배열 (다중 필터)' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 주문 수' })
  @ApiQuery({ name: 'search', required: false, description: '주문번호 검색' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'sortBy', required: false, description: '정렬 필드 (id, createdAt, totalAmount, status)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: '정렬 순서 (ASC, DESC)' })
  async findByBrandId(
    @Param('brandId') brandId: string,
    @Query('statuses[]') statuses?: string[],
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.ordersService.findByBrandId(brandId, {
      page,
      status: statuses && statuses.length === 1 ? statuses[0] : undefined,
      statuses: statuses && statuses.length > 1 ? statuses : undefined,
      limit,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });
  }

  @Get('brands/:brandId/monthly')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 월별 주문 조회 (브랜드 관리자용)' })
  @ApiResponse({ status: 200, description: '주문 목록 반환', type: [OrderResponseDto] })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  @ApiParam({ name: 'year', description: '조회할 연도' })
  @ApiParam({ name: 'month', description: '조회할 월' })
  async findMonthlyByBrandId(
    @Param('brandId') brandId: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    if (!year || !month) {
      const now = new Date();
      year = year || now.getFullYear();
      month = month || now.getMonth() + 1;
    }
    return this.ordersService.findMonthlyByBrandId(brandId, { year, month });
  }

  @Get('brands/:brandId/today')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 오늘 주문 조회 (브랜드 관리자용)' })
  @ApiResponse({ status: 200, description: '주문 목록 반환', type: [OrderResponseDto] })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  async findTodayByBrandId(@Param('brandId') brandId: string) {
    return this.ordersService.findTodayByBrandId(brandId);
  }

  @Patch('many/status')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 주문 상태 변경 (브랜드 관리자용)' })
  @ApiResponse({ status: 200, description: '주문 상태 변경 완료' })
  async updateStatusByBrandId(
    @Body() updateManyOrderStatusDto: UpdateManyOrderStatusDto,
  ) {
    return this.ordersService.updateManyStatus(updateManyOrderStatusDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드 주문 상태 변경 (브랜드 관리자용)' })
  @ApiResponse({ 
    status: 200, 
    description: '주문 상태 변경 완료', 
    type: OrderDetailResponseDto 
  })
  @ApiParam({ name: 'id', description: '주문 ID' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  // OC-005: 송장 입력 (관리자용)
  @Patch('admin/:id/shipping')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '송장 정보 입력 (관리자용)' })
  @ApiResponse({ status: 200, description: '송장 정보 입력 완료', type: OrderDetailResponseDto })
  @ApiParam({ name: 'id', description: '주문 ID' })
  async updateShipping(
    @Param('id') id: string,
    @Body() body: { deliveryCompany: string; deliveryTrackingNumber: string },
  ) {
    return this.ordersService.updateShippingInfo(id, body.deliveryCompany, body.deliveryTrackingNumber);
  }

  // OC-008: 부분 배송 처리 (관리자용)
  @Patch('admin/:id/partial-shipping')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '부분 배송 처리 (관리자용)' })
  @ApiResponse({ status: 200, description: '부분 배송 처리 완료', type: OrderDetailResponseDto })
  @ApiParam({ name: 'id', description: '주문 ID' })
  async partialShipping(
    @Param('id') id: string,
    @Body() body: { orderItemIds: string[]; deliveryCompany: string; deliveryTrackingNumber: string },
  ) {
    return this.ordersService.partialShipping(id, body.orderItemIds, body.deliveryCompany, body.deliveryTrackingNumber);
  }

  // OC-009: 배송 지연 주문 조회 (관리자용)
  @Get('admin/delayed')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '배송 지연 주문 조회 (관리자용)' })
  @ApiResponse({ status: 200, description: '배송 지연 주문 목록 반환', type: [OrderResponseDto] })
  async getDelayedOrders() {
    return this.ordersService.checkDeliveryDelay();
  }
} 