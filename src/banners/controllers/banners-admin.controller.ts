import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { BannersService } from '../banners.service';
import { BannerListQueryDto, CreateBannerDto, UpdateBannerDto } from '../dto/banner.dto';

@ApiTags('관리자 - 배너')
@Controller('admin/banners')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class BannersAdminController {
  constructor(private readonly service: BannersService) {}

  @Get()
  @ApiOperation({ summary: '배너 목록 (정렬: 공개 우선순위 → 비공개 최신)' })
  async list(@Query() query: BannerListQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '배너 상세' })
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '배너 생성 (공개 시 우선순위 필수, 1~3)' })
  async create(@Body() dto: CreateBannerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '배너 수정 (우선순위 삽입·중복 처리)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBannerDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/priority/:order')
  @ApiOperation({ summary: '우선순위 변경 (1~3). 비공개면 0 고정' })
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Param('order', ParseIntPipe) order: number,
  ) {
    return this.service.updatePriority(id, order);
  }

  @Delete(':id')
  @ApiOperation({ summary: '배너 삭제' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}


