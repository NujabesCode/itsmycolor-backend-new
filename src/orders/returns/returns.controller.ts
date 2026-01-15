import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import {
  CreateReturnRequestDto,
  UpdateReturnRequestDto,
  ReturnRequestResponseDto,
} from './dto/return-request.dto';
import { ReturnStatus } from './entities/return-request.entity';
import { BrandGuard } from '../../auth/guards/brand.guard';

@ApiTags('반품 관리')
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '반품 요청 등록' })
  @ApiResponse({ status: 201, description: '반품 요청 등록 완료', type: ReturnRequestResponseDto })
  async create(
    @Body() createReturnRequestDto: CreateReturnRequestDto,
    @GetUser() user: User,
  ) {
    return this.returnsService.create(createReturnRequestDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '반품 요청 목록 조회 (관리자용)' })
  @ApiResponse({ status: 200, description: '반품 요청 목록 반환', type: [ReturnRequestResponseDto] })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 요청 수' })
  @ApiQuery({ name: 'status', required: false, description: '반품 상태', enum: ReturnStatus })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: ReturnStatus,
  ) {
    return this.returnsService.findAll({ page, limit, status });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 반품 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '반품 요청 목록 반환', type: [ReturnRequestResponseDto] })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 요청 수' })
  @ApiQuery({ name: 'status', required: false, description: '반품 상태', enum: ReturnStatus })
  async findMy(
    @GetUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: ReturnStatus,
  ) {
    return this.returnsService.findAll({ 
      page, 
      limit, 
      status,
      userId: user.id 
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '반품 요청 상세 조회' })
  @ApiResponse({ status: 200, description: '반품 요청 상세 정보 반환', type: ReturnRequestResponseDto })
  @ApiParam({ name: 'id', description: '반품 요청 ID' })
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.returnsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '반품 상태 변경' })
  @ApiResponse({ status: 200, description: '반품 상태 변경 완료', type: ReturnRequestResponseDto })
  @ApiParam({ name: 'id', description: '반품 요청 ID' })
  async update(
    @Param('id') id: string,
    @Body() updateReturnRequestDto: UpdateReturnRequestDto,
  ) {
    return this.returnsService.update(id, updateReturnRequestDto);
  }

  @Patch(':id/shipping')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '반품 운송장 정보 업데이트' })
  @ApiResponse({ status: 200, description: '반품 운송장 정보 업데이트 완료', type: ReturnRequestResponseDto })
  @ApiParam({ name: 'id', description: '반품 요청 ID' })
  async updateShipping(
    @Param('id') id: string,
    @Body() updateDto: UpdateReturnRequestDto,
    @GetUser() user: User,
  ) {
    return this.returnsService.update(id, {
      returnTrackingNumber: updateDto.returnTrackingNumber
    }, user.id);
  }

  @Get('brands/:brandId')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 반품 문의 조회 (브랜드 관리자용)' })
  @ApiResponse({ status: 200, description: '반품 문의 목록 반환', type: [ReturnRequestResponseDto] })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  async findByBrandId(
    @Param('brandId') brandId: string,
  ) {
    return this.returnsService.findByBrandId(brandId);
  }
} 