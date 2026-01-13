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
import { CSManagementService } from './cs-management.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { BrandGuard } from '../../auth/guards/brand.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import {
  CreateCSInquiryDto,
  UpdateCSInquiryDto,
  CSInquiryResponseDto,
} from './dto/cs-inquiry.dto';
import { InquiryType } from './entities/cs-inquiry.entity';

@ApiTags('CS 관리')
@Controller('cs')
export class CSManagementController {
  constructor(private readonly csManagementService: CSManagementService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'CS 문의 등록' })
  @ApiResponse({ status: 201, description: 'CS 문의 등록 완료', type: CSInquiryResponseDto })
  async create(
    @Body() createCSInquiryDto: CreateCSInquiryDto,
    @GetUser() user: User,
  ) {
    return this.csManagementService.create(createCSInquiryDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'CS 문의 목록 조회 (관리자용)' })
  @ApiResponse({ status: 200, description: 'CS 문의 목록 반환', type: [CSInquiryResponseDto] })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 문의 수' })
  @ApiQuery({ name: 'type', required: false, description: '문의 유형', enum: InquiryType })
  @ApiQuery({ name: 'status', required: false, description: '문의 상태' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: InquiryType,
    @Query('status') status?: string,
  ) {
    return this.csManagementService.findAll({ page, limit, type, status });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 CS 문의 목록 조회' })
  @ApiResponse({ status: 200, description: '내 CS 문의 목록 반환', type: [CSInquiryResponseDto] })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 문의 수' })
  async findMyInquiries(
    @GetUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.csManagementService.findByUserId(user.id, { page, limit });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'CS 문의 상세 조회' })
  @ApiResponse({ status: 200, description: 'CS 문의 상세 정보 반환', type: CSInquiryResponseDto })
  @ApiParam({ name: 'id', description: 'CS 문의 ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.csManagementService.findOne(id, user.id);
  }

  @Put(':id/answer')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'CS 문의 답변 등록 (관리자용)' })
  @ApiResponse({ status: 200, description: 'CS 문의 답변 등록 완료', type: CSInquiryResponseDto })
  @ApiParam({ name: 'id', description: 'CS 문의 ID' })
  async updateAnswer(
    @Param('id') id: string,
    @Body() updateCSInquiryDto: UpdateCSInquiryDto,
  ) {
    return this.csManagementService.updateAnswer(id, updateCSInquiryDto);
  }

  @Get('brands/:brandId')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 CS 문의 조회 (브랜드 관리자용)' })
  @ApiResponse({ status: 200, description: 'CS 문의 목록 반환', type: [CSInquiryResponseDto] })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 문의 수' })
  @ApiQuery({ name: 'type', required: false, description: '문의 유형', enum: InquiryType })
  @ApiQuery({ name: 'status', required: false, description: '문의 상태' })
  async findByBrandId(
    @Param('brandId') brandId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: InquiryType,
    @Query('status') status?: string,
  ) {
    return this.csManagementService.findByBrandId(brandId, { page, limit, type, status });
  }
} 