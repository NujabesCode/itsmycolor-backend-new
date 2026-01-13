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
  UploadedFile,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import {
  FilesInterceptor,
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductDetailResponseDto } from './dto/product-detail-response.dto';
import { BodyType } from '../common/types/body-type.enum';
import { ColorSeason } from '../common/types/color-season.enum';
import { StyleCategory } from '../common/types/style-category.enum';
import { Gender } from '../common/types/gender.enum';
import { MajorCategory } from '../common/types/major-category.enum';
import { ClothingCategory } from '../common/types/clothing-category.enum';
import { BrandGuard } from '../auth/guards/brand.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { TryOnRequestDto } from './dto/try-on-request.dto';
import { TryOnResponseDto } from './dto/try-on-response.dto';
import { NotUserGuard } from 'src/auth/guards/not-user.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('상품')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '상품 등록 (관리자용)' })
  @ApiResponse({
    status: 201,
    description: '상품 생성 완료',
    type: ProductDetailResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productsService.create(createProductDto, files);
  }

  @Get()
  @ApiOperation({ summary: '상품 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '상품 목록 반환',
    type: [ProductResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 당 상품 수',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: '정렬 방식 (latest, recommended, sales, discount_desc, price_asc, price_desc, reviews)',
  })
  @ApiQuery({
    name: 'bodyType',
    required: false,
    description: '체형 필터링',
    enum: BodyType,
  })
  @ApiQuery({
    name: 'colorSeason',
    required: false,
    description: '퍼스널 컬러 필터링',
    enum: ColorSeason,
  })
  @ApiQuery({
    name: 'styleCategories',
    required: false,
    description: '스타일 카테고리 필터링',
    enum: StyleCategory,
    isArray: true,
  })
  @ApiQuery({ name: 'minPrice', required: false, description: '최소 가격' })
  @ApiQuery({ name: 'maxPrice', required: false, description: '최대 가격' })
  @ApiQuery({ name: 'search', required: false, description: '검색어' })
  @ApiQuery({ name: 'recommendedGender', required: false, description: '추천 성별', enum: Gender })
  @ApiQuery({ name: 'majorCategory', required: false, description: '형태별 대분류 카테고리', enum: MajorCategory })
  @ApiQuery({ name: 'clothingCategory', required: false, description: '의류 카테고리', enum: ClothingCategory })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
    @Query('bodyType') bodyType?: BodyType,
    @Query('colorSeasons[]') colorSeasons?: ColorSeason[],
    @Query('styleCategories[]')
    styleCategories?: StyleCategory | StyleCategory[],
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('search') search?: string,
    @Query('recommendedGender') recommendedGender?: Gender,
    @Query('majorCategory') majorCategory?: MajorCategory,
    @Query('clothingCategory') clothingCategory?: ClothingCategory,
  ) {
    return this.productsService.findAll({
      page,
      limit,
      sort,
      bodyType,
      colorSeasons:
        typeof colorSeasons === 'string'
          ? [colorSeasons as ColorSeason]
          : colorSeasons,
      styleCategories:
        typeof styleCategories === 'string'
          ? [styleCategories as StyleCategory]
          : styleCategories,
      minPrice,
      maxPrice,
      search,
      recommendedGender,
      majorCategory,
      clothingCategory,
    });
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '상품 목록 조회 (관리자용)' })
  @ApiResponse({
    status: 200,
    description: '상품 목록 반환',
    type: [ProductResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 당 상품 수',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: '정렬 방식 (latest, recommended, sales, discount_desc, price_asc, price_desc, reviews)',
  })
  @ApiQuery({
    name: 'bodyType',
    required: false,
    description: '체형 필터링',
    enum: BodyType,
  })
  @ApiQuery({ name: 'search', required: false, description: '검색어' })
  async findAllForAdmin(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
    @Query('bodyType') bodyType?: BodyType,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAllForAdmin({
      page,
      limit,
      sort,
      bodyType,
      search,
    });
  }

  @Get('main')
  @ApiOperation({ summary: '메인 섹션 배치 조회(어드민과 동일 구조)' })
  @ApiResponse({
    status: 200,
    description: '메인 섹션 배치 배열 반환',
  })
  async findMainProducts() {
    return this.productsService.findMainProducts();
  }

  @Get('popular-by-gender')
  @ApiOperation({ summary: '남/여 성별별 인기 상품(조회수 기준) 10개' })
  @ApiQuery({ name: 'gender', required: false, enum: Gender, description: '없으면 남/여 모두 반환' })
  async popularByGender(@Query('gender') gender?: Gender) {
    return this.productsService.findPopularByGender(gender as Gender | undefined);
  }

  @Get('likes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 찜한 상품 조회' })
  @ApiResponse({
    status: 200,
    description: '찜한 상품 목록 반환',
    type: [ProductResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 당 상품 수' })
  async findLikedProducts(
    @GetUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findLikedProducts(user, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: '상품 상세 조회' })
  @ApiResponse({
    status: 200,
    description: '상품 상세 정보 반환',
    type: ProductDetailResponseDto,
  })
  @ApiParam({ name: 'id', description: '상품 ID' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, NotUserGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '상품 수정 (관리자용)' })
  @ApiResponse({
    status: 200,
    description: '상품 수정 완료',
    type: ProductDetailResponseDto,
  })
  @ApiParam({ name: 'id', description: '상품 ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImage', maxCount: 1 },
      { name: 'additionalImages', maxCount: 10 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: {
      mainImage?: Express.Multer.File[];
      additionalImages?: Express.Multer.File[];
    },
  ) {
    return this.productsService.update(id, updateProductDto, files?.mainImage, files?.additionalImages);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, NotUserGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '상품 삭제 (관리자용)' })
  @ApiResponse({ status: 200, description: '상품 삭제 완료' })
  @ApiParam({ name: 'id', description: '상품 ID' })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get('color/:colorSeason')
  @ApiOperation({ summary: '퍼스널컬러 별 상품 조회' })
  @ApiResponse({
    status: 200,
    description: '상품 목록 반환',
    type: [ProductResponseDto],
  })
  @ApiParam({
    name: 'colorSeason',
    description: '퍼스널컬러 시즌',
    enum: ColorSeason,
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 당 상품 수',
  })
  async findByColorSeason(
    @Param('colorSeason') colorSeason: ColorSeason,
    @Query('page') page = 1,
    @Query('limit') limit = 12,
  ) {
    return this.productsService.findByColorSeason(colorSeason, { page, limit });
  }

  @Get('body/:bodyType')
  @ApiOperation({ summary: '체형 별 상품 조회' })
  @ApiResponse({
    status: 200,
    description: '상품 목록 반환',
    type: [ProductResponseDto],
  })
  @ApiParam({ name: 'bodyType', description: '체형', enum: BodyType })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 당 상품 수',
  })
  async findByBodyType(
    @Param('bodyType') bodyType: BodyType,
    @Query('page') page = 1,
    @Query('limit') limit = 12,
  ) {
    return this.productsService.findByBodyType(bodyType, { page, limit });
  }

  @Get('brands/:brandId/shipping-latest')
  @UseGuards(JwtAuthGuard, BrandGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '브랜드별 최근 배송/환불 정보 조회 (셀러용)' })
  @ApiResponse({
    status: 200,
    description: '가장 최근 등록된 상품의 배송/환불 정보 반환',
  })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  async findLatestShippingInfoByBrand(@Param('brandId') brandId: string) {
    return this.productsService.findLatestShippingInfoByBrand(brandId);
  }

  @Post('try-on')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '제품 시착하기' })
  @ApiResponse({
    status: 201,
    description: '시착 이미지 생성 완료',
    type: TryOnResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          format: 'uuid',
          description: '제품 ID',
        },
        category: {
          type: 'string',
          description: '카테고리 (tops, bottoms, outerwear, dresses 등)',
          example: 'tops',
        },
        userImage: {
          type: 'string',
          format: 'binary',
          description: '사용자 얼굴 이미지',
        },
      },
      required: ['productId', 'userImage'],
    },
  })
  @UseInterceptors(FileInterceptor('userImage'))
  async tryOn(
    @Body() tryOnRequestDto: TryOnRequestDto,
    @UploadedFile() userImage: Express.Multer.File,
  ) {
    return this.productsService.tryOn(tryOnRequestDto, userImage);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '상품 찜' })
  @ApiParam({ name: 'id', description: '상품 ID' })
  async likeProduct(@Param('id') id: string, @GetUser() user: User) {
    await this.productsService.likeProduct(id, user);
    return { message: '상품 찜 완료' };
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '상품 찜 취소' })
  @ApiParam({ name: 'id', description: '상품 ID' })
  async unlikeProduct(@Param('id') id: string, @GetUser() user: User) {
    await this.productsService.unlikeProduct(id, user);
    return { message: '상품 찜 취소 완료' };
  }

  @Get('brands/:brandId')
  @ApiOperation({ summary: '브랜드별 상품 조회' })
  @ApiResponse({
    status: 200,
    description: '상품 목록 반환',
    type: [ProductResponseDto],
  })
  @ApiParam({ name: 'brandId', description: '브랜드 ID' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 당 상품 수',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: '정렬 방식 (latest, recommended, sales, discount_desc, price_asc, price_desc, reviews)',
  })
  async findByBrandId(
    @Param('brandId') brandId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ) {
    return this.productsService.findByBrandId(brandId, { page, limit, sort });
  }
}
