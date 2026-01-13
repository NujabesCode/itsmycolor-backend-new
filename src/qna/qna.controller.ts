import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { QnaService } from './qna.service';
import { CreateQnaDto } from './dto/create-qna.dto';
import { UpdateQnaDto } from './dto/update-qna.dto';
import { AnswerQnaDto } from './dto/answer-qna.dto';
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
import { FilesInterceptor } from '@nestjs/platform-express';
import { QnaResponseDto } from './dto/qna-response.dto';
import { PaginationDto } from './dto/pagination.dto';
import { BrandGuard } from 'src/auth/guards/brand.guard';
import { NotUserGuard } from 'src/auth/guards/not-user.guard';

@ApiTags('문의')
@Controller('qna')
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문의 등록' })
  @ApiResponse({ status: 201, description: '문의 생성 완료', type: QnaResponseDto })
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @Body() createQnaDto: CreateQnaDto,
    @GetUser() user: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.qnaService.create(createQnaDto, user.id, files);
  }

  @Get()
  @ApiOperation({ summary: '모든 문의 목록 조회' })
  @ApiResponse({ status: 200, description: '문의 목록 반환', type: [QnaResponseDto] })
  @ApiQuery({ name: 'productId', required: false, description: '상품 ID' })
  @ApiQuery({ name: 'type', required: false, description: '문의 유형' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 항목 수' })
  async findAll(
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.qnaService.findAll({ 
      productId, 
      type, 
      paginationDto
    });
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: '문의 목록 조회 (관리자용)' })
  @ApiResponse({ status: 200, description: '문의 목록 반환', type: [QnaResponseDto] })
  @ApiQuery({ name: 'type', required: false, description: '문의 유형' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 항목 수' })
  async findAllForAdmin(
    @Query('type') type?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.qnaService.findAllForAdmin({ 
      type, 
      paginationDto
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 문의 목록 조회' })
  @ApiResponse({ status: 200, description: '내 문의 목록 반환', type: [QnaResponseDto] })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 항목 수' })
  @ApiQuery({ name: 'status', required: false, description: '문의 상태' })
  @ApiQuery({ name: 'type', required: false, description: '문의 유형' })
  @ApiQuery({ name: 'search', required: false, description: '검색어' })
  async findMyQna(
    @GetUser() user: User,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.qnaService.findByUserId(user.id, paginationDto, {
      status,
      type,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '문의 상세 조회' })
  @ApiResponse({ status: 200, description: '문의 정보 반환', type: QnaResponseDto })
  @ApiParam({ name: 'id', description: '문의 ID' })
  async findOne(@Param('id') id: string) {
    return this.qnaService.findOne(id);
  }

  @Get('brands/:brandId')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드 별 qna 조회 (관리자용)' })
  @ApiResponse({ status: 200, description: '답변 완료', type: [QnaResponseDto] })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  async findByBrandId (
    @Param('brandId') brandId: string,
  ) {
    return this.qnaService.findByBrandId(brandId);
  }


  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문의 수정' })
  @ApiResponse({ status: 200, description: '문의 수정 완료', type: QnaResponseDto })
  @ApiParam({ name: 'id', description: '문의 ID' })
  @UseInterceptors(FilesInterceptor('images', 5))
  async update(
    @Param('id') id: string,
    @Body() updateQnaDto: UpdateQnaDto,
    @GetUser() user: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const qna = await this.qnaService.findOne(id);
    if (qna.userId !== user.id) {
      throw new ForbiddenException('자신의 문의만 수정할 수 있습니다.');
    }
    return this.qnaService.update(id, updateQnaDto, files);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문의 삭제' })
  @ApiResponse({ status: 200, description: '문의 삭제 완료' })
  @ApiParam({ name: 'id', description: '문의 ID' })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    const qna = await this.qnaService.findOne(id);
    if (qna.userId !== user.id) {
      throw new ForbiddenException('자신의 문의만 삭제할 수 있습니다.');
    }
    return this.qnaService.remove(id);
  }

  @Post(':id/answer')
  @UseGuards(JwtAuthGuard, NotUserGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문의 답변 등록' })
  @ApiResponse({ status: 200, description: '문의 답변 완료', type: QnaResponseDto })
  @ApiParam({ name: 'id', description: '문의 ID' })
  async answer(
    @Param('id') id: string,
    @Body() answerQnaDto: AnswerQnaDto,
    @GetUser() user: User,
  ) {
    return this.qnaService.answer(id, answerQnaDto, user.id);
  }

  @Put('brands/:brandId/answer/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드 문의 답변 (관리자용)' })
  @ApiResponse({ status: 200, description: '답변 완료', type: QnaResponseDto })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  @ApiParam({ name: 'id', description: '문의 ID' })
  async answerBrandQna(
    @Param('id') id: string,
    @Param('brandId') brandId: string,
    @Body() answerQnaDto: AnswerQnaDto,
    @GetUser() user: User,
  ) {
    return this.qnaService.answer(id, answerQnaDto, user.id);
  }
} 