import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandResponseDto } from './dto/brand-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { BrandStatus } from './entities/brand.entity';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateBrandStatusDto } from './dto/update-brand-status.dto';
import { BrandGuard } from 'src/auth/guards/brand.guard';

@ApiTags('브랜드')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드 등록' })
  @ApiResponse({ status: 201, description: '브랜드 등록 완료', type: BrandResponseDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'background', maxCount: 1 },
      { name: 'brandPdf', maxCount: 1 },
    ])
  )
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFiles() files: { logo?: Express.Multer.File[], background?: Express.Multer.File[], brandPdf?: Express.Multer.File[] },
  ) {
    return this.brandsService.create(createBrandDto, files);
  }

  @Post('connect-url')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: '브랜드 연동 URL 생성' })
  @ApiResponse({ status: 200, description: '브랜드 연동 URL 생성 완료', type: String })
  async createBrandConnectUrl(@Body('brandId') brandId: string) {
    return this.brandsService.createBrandConnectUrl(brandId);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '모든 브랜드 목록 조회 (관리자용)' })
  @ApiResponse({ status: 200, description: '모든 브랜드 목록 반환', type: [BrandResponseDto] })
  @ApiQuery({ name: 'status', required: false, description: '브랜드 상태' })
  async findAllForAdmin(
    @Query('status') status?: BrandStatus,
  ) {
    return this.brandsService.findAllForAdmin(status);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 브랜드 목록 조회' })
  @ApiResponse({ status: 200, description: '내 브랜드 목록 반환', type: [BrandResponseDto] })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 표시할 브랜드 수' })
  async findMyBrands(
    @GetUser() user: User,
    @Query() paginationDto: PaginationDto
  ) {
    return this.brandsService.findByUserId(user.id, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '브랜드 상세 조회' })
  @ApiResponse({ status: 200, description: '브랜드 정보 반환', type: BrandResponseDto })
  @ApiParam({ name: 'id', description: '브랜드 ID' })
  async findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드 정보 수정' })
  @ApiResponse({ status: 200, description: '브랜드 정보 수정 완료', type: BrandResponseDto })
  @ApiParam({ name: 'id', description: '브랜드 ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'background', maxCount: 1 },
    ])
  )
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @UploadedFiles() files: { logo?: Express.Multer.File[], background?: Express.Multer.File[] },
  ) {
    return this.brandsService.update(id, updateBrandDto, files);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드 상태 변경 (관리자용)' })
  @ApiResponse({ status: 200, description: '브랜드 상태 변경 완료', type: BrandResponseDto })
  @ApiParam({ name: 'id', description: '브랜드 ID' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateBrandStatusDto,
    @GetUser() admin: User, // SM-012: 관리자 이름을 위해 추가
  ) {
    return this.brandsService.updateStatus(id, statusDto, admin.name || admin.email);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드 삭제' })
  @ApiResponse({ status: 200, description: '브랜드 삭제 완료' })
  @ApiParam({ name: 'id', description: '브랜드 ID' })
  async remove(
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    const brand = await this.brandsService.findOne(id);
    if (brand['userId'] !== user.id) {
      // 관리자 권한 확인 로직 필요 (실제 구현시)
      // 여기서는 생략
    }
    return this.brandsService.remove(id);
  }

  // 브랜드 찜
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드 찜' })
  @ApiParam({ name: 'id', description: '브랜드 ID' })
  async likeBrand(@Param('id') id: string, @GetUser() user: User) {
    await this.brandsService.likeBrand(id, user);
    return { message: '브랜드 찜 완료' };
  }

  // 브랜드 찜 취소
  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드 찜 취소' })
  @ApiParam({ name: 'id', description: '브랜드 ID' })
  async unlikeBrand(@Param('id') id: string, @GetUser() user: User) {
    await this.brandsService.unlikeBrand(id, user);
    return { message: '브랜드 찜 취소 완료' };
  }
} 