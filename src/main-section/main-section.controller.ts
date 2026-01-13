import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { MainSectionService } from './main-section.service';
import { ReplaceAssignmentDto, SearchProductsQueryDto, UpdatePriorityDto, UpsertAssignmentDto } from './dto/main-section.dto';

@ApiTags('관리자 - 메인섹션')
@Controller('admin/main-section')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class MainSectionAdminController {
  constructor(private readonly service: MainSectionService) {}

  @Get('assignments')
  @ApiOperation({ summary: '메인 섹션 고정 카드 목록(슬롯별, 우선순위 포함)' })
  async list() {
    return this.service.listFixed();
  }

  @Post('assignments')
  @ApiOperation({ summary: '메인 섹션 카드 배치/수정(우선순위 없음)' })
  async upsert(@Body() dto: UpsertAssignmentDto) {
    return this.service.upsert(dto);
  }

  @Patch('assignments')
  @ApiOperation({ summary: 'slotKey에 연결된 상품 교체(갈아끼우기)' })
  async replace(@Body() dto: ReplaceAssignmentDto) {
    return this.service.replace(dto);
  }

  @Patch('assignments/:id/priority')
  @ApiOperation({ summary: '우선순위 제거됨(호환용 no-op)' })
  async updatePriority(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePriorityDto,
  ) {
    return this.service.updatePriority(id, dto.priority);
  }

  @Delete('assignments/:id')
  @ApiOperation({ summary: '배치 해제' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.remove(id);
    return { success: true };
  }

  @Get('search-products')
  @ApiOperation({ summary: '제품/브랜드 OR 검색 + (옵션) 카테고리 필터' })
  async search(@Query() query: SearchProductsQueryDto) {
    const { q, page = 1, limit = 20, category } = query;
    return this.service.searchProducts(q, Number(page) || 1, Number(limit) || 20, category);
  }
}


