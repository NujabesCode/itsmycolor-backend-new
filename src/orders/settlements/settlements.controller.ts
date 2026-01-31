import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SettlementsService } from './settlements.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { BrandGuard } from '../../auth/guards/brand.guard';
import {
  CreateSettlementDto,
  UpdateSettlementDto,
  SettlementResponseDto,
  SettlementStatsDto,
} from './dto/settlement.dto';

@ApiTags('정산')
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '정산 목록 조회' })
  @ApiResponse({ status: 200, description: '정산 목록 반환', type: [SettlementResponseDto] })
  @ApiQuery({ name: 'brandId', required: false, description: '브랜드 ID' })
  @ApiQuery({ name: 'year', required: false, description: '년도' })
  @ApiQuery({ name: 'month', required: false, description: '월' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료일 (YYYY-MM-DD)' })
  async findAll(
    @Query('brandId') brandId?: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.settlementsService.findAll({ brandId, year, month, startDate, endDate });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '정산 통계 조회' })
  @ApiResponse({ status: 200, description: '월별 정산 통계 반환', type: [SettlementStatsDto] })
  @ApiQuery({ name: 'startDate', required: false, description: '시작일' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료일' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.settlementsService.getStats(startDate, endDate);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '정산 상세 조회' })
  @ApiResponse({ status: 200, description: '정산 상세 정보 반환', type: SettlementResponseDto })
  @ApiParam({ name: 'id', description: '정산 ID' })
  async findOne(@Param('id') id: string) {
    return this.settlementsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '정산 정보 수정' })
  @ApiResponse({ status: 200, description: '정산 정보 수정 완료', type: SettlementResponseDto })
  @ApiParam({ name: 'id', description: '정산 ID' })
  async update(
    @Param('id') id: string,
    @Body() updateSettlementDto: UpdateSettlementDto,
  ) {
    return this.settlementsService.update(id, updateSettlementDto);
  }

  @Post('calculate-monthly')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '월별 정산 자동 계산' })
  @ApiResponse({ status: 201, description: '월별 정산 계산 완료', type: SettlementResponseDto })
  @ApiQuery({ name: 'year', required: false, description: '년도' })
  @ApiQuery({ name: 'month', required: false, description: '월' })
  async calculateMonthly(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.settlementsService.calculateMonthlySettlement(year, month);
  }

  @Get('brands-with-orders')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '해당 년월에 주문이 있는 브랜드 목록 조회' })
  @ApiResponse({ status: 200, description: '브랜드 목록 반환' })
  @ApiQuery({ name: 'year', required: true, description: '년도' })
  @ApiQuery({ name: 'month', required: true, description: '월' })
  async getBrandsWithOrders(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.settlementsService.getBrandsWithOrders(year, month);
  }

  @Post('calculate-brand')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 정산 자동 계산' })
  @ApiResponse({ status: 201, description: '브랜드별 정산 계산 완료', type: SettlementResponseDto })
  @ApiQuery({ name: 'brandId', required: true, description: '브랜드 ID' })
  @ApiQuery({ name: 'year', required: false, description: '년도 (선택사항, 없으면 전체 기간)' })
  @ApiQuery({ name: 'month', required: false, description: '월 (선택사항, 없으면 전체 기간)' })
  @ApiQuery({ name: 'commissionRate', required: false, description: '수수료율 (%)', type: Number })
  async calculateBrandSettlement(
    @Query('brandId') brandId: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('commissionRate') commissionRate?: number,
  ) {
    return this.settlementsService.calculateBrandSettlement(brandId, year, month, commissionRate || 12);
  }

  @Post('brands/:brandId')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 정산 생성' })
  @ApiResponse({ status: 201, description: '정산 생성 완료', type: SettlementResponseDto })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  async createBrandSettlement(
    @Param('brandId') brandId: string,
    @Body() createSettlementDto: CreateSettlementDto,
  ) {
    return this.settlementsService.createBrandSettlement(brandId, createSettlementDto);
  }

  @Get('brands/:brandId')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 정산 목록 조회' })
  @ApiResponse({ status: 200, description: '정산 목록 반환', type: [SettlementResponseDto] })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  async findBrandSettlements(@Param('brandId') brandId: string) {
    return this.settlementsService.findBrandSettlements(brandId);
  }

  @Put(':id/complete')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 정산 완료 처리 (관리자용)' })
  @ApiResponse({ status: 200, description: '정산 완료 처리됨', type: SettlementResponseDto })
  @ApiParam({ name: 'id', description: '정산 ID' })
  async completeBrandSettlement(
    @Param('id') id: string,
  ) {
    return this.settlementsService.completeBrandSettlement(id);
  }

  @Put(':id/confirm')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '정산 확정 처리 (지급 예정 상태로 변경)' })
  @ApiResponse({ status: 200, description: '정산 확정 처리됨', type: SettlementResponseDto })
  @ApiParam({ name: 'id', description: '정산 ID' })
  async confirmSettlement(
    @Param('id') id: string,
  ) {
    return this.settlementsService.confirmSettlement(id);
  }

  @Put(':id/payment-complete')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '지급 완료 처리' })
  @ApiResponse({ status: 200, description: '지급 완료 처리됨', type: SettlementResponseDto })
  @ApiParam({ name: 'id', description: '정산 ID' })
  async completePayment(
    @Param('id') id: string,
  ) {
    return this.settlementsService.completePayment(id);
  }
} 