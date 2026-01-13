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
  BadRequestException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReviewResponseDto } from './dto/review-response.dto';

@ApiTags('리뷰')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 작성' })
  @ApiResponse({ status: 201, description: '리뷰 생성 완료', type: ReviewResponseDto })
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @GetUser() user: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const review = await this.reviewsService.create(createReviewDto, user.id, files);
    return new ReviewResponseDto(review);
  }

  @Get()
  @ApiOperation({ summary: '리뷰 목록 조회' })
  @ApiResponse({ status: 200, description: '리뷰 목록 반환', type: [ReviewResponseDto] })
  @ApiQuery({ name: 'productId', required: false, description: '상품 ID' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 항목 수' })
  @ApiQuery({ name: 'sort', required: false, description: '정렬 방식 (latest, rating)', default: 'latest' })
  async findAll(
    @Query('productId') productId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sort') sort = 'latest',
  ) {
    const result = await this.reviewsService.findAll(productId, page, limit);
    
    return {
      reviews: result.reviews.map(review => new ReviewResponseDto(review)),
      total: result.total,
      page: result.page,
      lastPage: result.lastPage,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '리뷰 상세 조회' })
  @ApiResponse({ status: 200, description: '리뷰 정보 반환', type: ReviewResponseDto })
  async findOne(@Param('id') id: string) {
    const review = await this.reviewsService.findOne(id);
    return new ReviewResponseDto(review);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 수정' })
  @ApiResponse({ status: 200, description: '리뷰 수정 완료', type: ReviewResponseDto })
  @UseInterceptors(FilesInterceptor('images', 5))
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @GetUser() user: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const review = await this.reviewsService.update(id, updateReviewDto, user.id, files);
    return new ReviewResponseDto(review);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 삭제' })
  @ApiResponse({ status: 200, description: '리뷰 삭제 완료' })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return this.reviewsService.remove(id, user.id);
  }

  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 도움이 돼요 추가' })
  @ApiResponse({ status: 200, description: '도움이 돼요 추가 완료' })
  async addHelpful(@Param('id') id: string, @GetUser() user: User) {
    return this.reviewsService.addHelpful(id, user.id);
  }
} 