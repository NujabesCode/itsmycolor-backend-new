import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In, Brackets, IsNull } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BodyType } from '../common/types/body-type.enum';
import { ColorSeason } from '../common/types/color-season.enum';
import { StyleCategory } from '../common/types/style-category.enum';
import { FilesService } from '../files/files.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductDetailResponseDto } from './dto/product-detail-response.dto';
import { TryOnRequestDto } from './dto/try-on-request.dto';
import { TryOnResponseDto } from './dto/try-on-response.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ProductLike } from './entities/product-like.entity';
import { User } from '../users/entities/user.entity';
import { Gender } from '../common/types/gender.enum';
import { Review } from '../reviews/entities/review.entity';
import { MajorCategory } from '../common/types/major-category.enum';
import { ClothingCategory } from '../common/types/clothing-category.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductLike)
    private productLikeRepository: Repository<ProductLike>,
    private filesService: FilesService,
    private configService: ConfigService,
  ) {}
  
  // 메인 섹션 지정 데이터 우선 사용을 위해 주입 없이 레이지 로드
  private async getMainAssignmentsMap() {
    try {
      const { MainSectionAssignment } = await import('../main-section/entities/main-section-assignment.entity');
      const { getDataSourceToken } = await import('@nestjs/typeorm');
      // TypeORM 리포지토리 직접 획득 (모듈 의존성 추가 없이 순환참조 방지)
      const orm = (this.productRepository.manager.connection as any);
      const repo = orm.getRepository(MainSectionAssignment);
      // 우선순위 제거 규칙 반영: slotKey별 최신(updatedAt DESC) 1건만 사용
      const items = await repo
        .createQueryBuilder('a')
        .leftJoinAndSelect('a.product', 'product')
        .orderBy('a.updatedAt', 'DESC')
        .addOrderBy('a.createdAt', 'DESC')
        .getMany();
      const map = new Map<string, Product>();
      const normalize = (k: string) => k.trim().replace(/\s+/g, ' ').toLowerCase();
      for (const a of items) {
        const key = normalize(a.slotKey);
        if (map.has(key)) continue; // slotKey 당 1건만
        if (a.product && a.product.isAvailable && !a.product.isDeleted) {
          map.set(key, a.product);
        }
      }
      return map;
    } catch {
      return new Map<string, Product>();
    }
  }

  async create(
    createProductDto: CreateProductDto,
    files?: Express.Multer.File[],
  ): Promise<ProductDetailResponseDto> {
    console.log('[ProductsService.create] 상품 등록 요청 시작:', {
      name: createProductDto.name,
      brandId: createProductDto.brandId,
      isAvailable: createProductDto.isAvailable,
    });
    
    // PD-012: 중복 등록 검증 - 동일 상품명 & 모델명 체크
    const whereCondition: any = {
      name: createProductDto.name,
      brandId: createProductDto.brandId,
      isDeleted: false,
    };
    
    if (createProductDto.modelInfo) {
      whereCondition.modelInfo = createProductDto.modelInfo;
    } else {
      whereCondition.modelInfo = IsNull();
    }
    
    const existingProduct = await this.productRepository.findOne({
      where: whereCondition,
    });

    if (existingProduct) {
      throw new BadRequestException('동일한 상품명과 모델명의 상품이 이미 등록되어 있습니다.');
    }

    // 판매자가 상품을 등록할 때는 항상 승인 대기 상태로 시작
    // DTO에서 isAvailable이 전달되더라도 무시하고 항상 false로 설정
    const productData = {
      ...createProductDto,
      brandEntity: { id: createProductDto.brandId },
      // 판매자 등록 시 항상 isAvailable = false (승인 대기) - DTO 값 무시
      isAvailable: false,
      // isDeleted도 명시적으로 false로 설정
      isDeleted: false,
    };
    
    const product = this.productRepository.create(productData);
    
    console.log('[ProductsService.create] 상품 생성:', {
      name: product.name,
      brandId: createProductDto.brandId,
      isAvailable: product.isAvailable,
      isDeleted: product.isDeleted,
      brandEntity: product.brandEntity,
    });
    
    // 이미지 업로드 및 URL 저장
    if (files && files.length > 0) {
      try {
        const mainImageFile = files[0];
        const mainImageUrl = await this.filesService.uploadFile(mainImageFile, 'products');
        console.log('[ProductsService] 생성된 메인 이미지 URL:', mainImageUrl);
        product.imageUrl = mainImageUrl;
        
        // 추가 이미지 처리
        if (files.length > 1) {
          const additionalFiles = files.slice(1);
          const additionalImageUrls = await Promise.all(
            additionalFiles.map(file => this.filesService.uploadFile(file, 'products'))
          );
          console.log('[ProductsService] 생성된 추가 이미지 URLs:', additionalImageUrls);
          product.additionalImageUrls = additionalImageUrls;
        }
      } catch (error: any) {
        console.error('[ProductsService] 이미지 업로드 실패:', error);
        console.error('[ProductsService] 에러 상세:', error.message, error.stack);
        throw new BadRequestException(`이미지 업로드에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
      }
    }
    
    const savedProduct = await this.productRepository.save(product);
    
    console.log('[ProductsService.create] 상품 저장 완료:', {
      id: savedProduct.id,
      name: savedProduct.name,
      brandId: savedProduct.brandId,
      isAvailable: savedProduct.isAvailable,
      isDeleted: savedProduct.isDeleted,
      imageUrl: savedProduct.imageUrl,
      createdAt: savedProduct.createdAt,
    });
    
    // 저장 후 실제로 DB에 저장되었는지 확인
    const verifyProduct = await this.productRepository.findOne({
      where: { id: savedProduct.id },
      relations: ['brandEntity'],
    });
    
    if (verifyProduct) {
      console.log('[ProductsService.create] ✅ DB 저장 확인 성공:', {
        id: verifyProduct.id,
        name: verifyProduct.name,
        isAvailable: verifyProduct.isAvailable,
        isDeleted: verifyProduct.isDeleted,
        brandId: verifyProduct.brandId,
        brandName: verifyProduct.brandEntity?.name,
      });
    } else {
      console.error('[ProductsService.create] ⚠️ DB 저장 확인 실패: 상품을 찾을 수 없습니다.');
    }
    
    return new ProductDetailResponseDto(savedProduct);
  }

  // 공개용: 어드민과 동일 구조의 메인 섹션 배치 반환
  async findMainAssignmentsPublic(): Promise<any[]> {
    try {
      const { MainSectionAssignment } = await import('../main-section/entities/main-section-assignment.entity');
      const orm = (this.productRepository.manager.connection as any);
      const repo = orm.getRepository(MainSectionAssignment);
      return await repo
        .createQueryBuilder('a')
        .leftJoinAndSelect('a.product', 'product')
        .orderBy("REGEXP_REPLACE(a.slotKey, ' [0-9]+$', '')", 'ASC')
        .addOrderBy("CAST(SUBSTRING_INDEX(a.slotKey, ' ', -1) AS UNSIGNED)", 'ASC')
        .getMany();
    } catch (e) {
      return [];
    }
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    sort?: string;
    bodyType?: BodyType;
    colorSeasons?: ColorSeason[];
    styleCategories?: StyleCategory[];
    minPrice?: number;
    maxPrice?: number;
    clothingCategory?: ClothingCategory;
    search?: string;
    recommendedGender?: Gender;
    majorCategory?: MajorCategory;
  }): Promise<{ products: ProductResponseDto[]; total: number; page: number; lastPage: number }> {
    const {
      page = 1,
      limit = 12,
      sort = 'latest',
      bodyType,
      colorSeasons,
      styleCategories,
      minPrice,
      maxPrice,
      search,
      recommendedGender,
      majorCategory,
      clothingCategory,
    } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepository.createQueryBuilder('product');
    queryBuilder.leftJoinAndSelect('product.brandEntity', 'brand');

    // 집계 컬럼: 찜 수/리뷰 수 (정렬 및 응답 사용)
    queryBuilder.addSelect(
      (sub) => sub.select('COUNT(*)').from(ProductLike, 'pl').where('pl.productId = product.id'),
      'likesCount',
    );
    queryBuilder.addSelect(
      (sub) => sub.select('COUNT(*)').from('review', 'r').where('r.productId = product.id'),
      'reviewCount',
    );
    // 할인율 별칭 컬럼 (NULL/0 보호)
    queryBuilder.addSelect(
      `CASE WHEN product.originalPriceKr IS NULL OR product.originalPriceKr = 0
            THEN 0
            ELSE (product.originalPriceKr - product.price) / product.originalPriceKr END`,
      'discountRate',
    );

    // 응답용으로도 맵핑
    queryBuilder.loadRelationCountAndMap('product.likesCount', 'product.productLikes');
    queryBuilder.loadRelationCountAndMap('product.reviewsCount', 'product.reviews');

    // 필터링 조건 적용
    if (bodyType) {
      queryBuilder.andWhere('product.recommendedBodyType = :bodyType', { bodyType });
    }

    if (recommendedGender) {
      queryBuilder.andWhere('product.recommendedGender = :recommendedGender', { recommendedGender });
    }

    if (majorCategory) {
      queryBuilder.andWhere('product.majorCategory = :majorCategory', { majorCategory });
    }

    if (clothingCategory) {
      queryBuilder.andWhere('product.clothingCategory = :clothingCategory', { clothingCategory });
    }

    if (colorSeasons && colorSeasons.length > 0) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          colorSeasons.forEach((colorSeason, idx) => {
            // URL 인코딩된 +를 공백으로 변환
            const decodedColorSeason = colorSeason.replace(/\+/g, ' ');
            // simple-array는 쉼표로 구분된 문자열로 저장되므로 LIKE 사용
            if (idx === 0) {
              qb.where(
                `(product.recommendedColorSeason IS NOT NULL AND product.recommendedColorSeason LIKE :colorSeason${idx})`,
                { [`colorSeason${idx}`]: `%${decodedColorSeason}%` },
              );
            } else {
              qb.orWhere(
                `(product.recommendedColorSeason IS NOT NULL AND product.recommendedColorSeason LIKE :colorSeason${idx})`,
                { [`colorSeason${idx}`]: `%${decodedColorSeason}%` },
              );
            }
          });
        }),
      )
    }

    if (styleCategories && styleCategories.length > 0) {
      queryBuilder.andWhere(
        new Brackets(qb => {
          styleCategories.forEach((category, idx) => {
            // simple-array는 쉼표로 구분된 문자열로 저장되므로 LIKE 사용
            if (idx === 0) {
              qb.where(
                `(product.styleCategories IS NOT NULL AND product.styleCategories LIKE :styleCategory${idx})`,
                { [`styleCategory${idx}`]: `%${category}%` },
              );
            } else {
              qb.orWhere(
                `(product.styleCategories IS NOT NULL AND product.styleCategories LIKE :styleCategory${idx})`,
                { [`styleCategory${idx}`]: `%${category}%` },
              );
            }
          });
        }),
      );
    }

    if (minPrice && maxPrice) {
      queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
        minPrice,
        maxPrice,
      });
    } else if (minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    } else if (maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // UI-038: 대소문자 구분 없이 검색
    if (search) {
      const normalizedSearch = search.toLowerCase();
      queryBuilder.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search OR LOWER(product.brand) LIKE :search)',
        { search: `%${normalizedSearch}%` },
      );
    }

    // 삭제되지 않은 상품만 표시 - 모든 필터 조건 제거
    queryBuilder.andWhere('product.isDeleted = FALSE');

    // 정렬 방식 적용
    if (sort === 'price_asc') {
      queryBuilder.orderBy('product.price', 'ASC');
    } else if (sort === 'price_desc') {
      queryBuilder.orderBy('product.price', 'DESC');
    } else if (sort === 'recommended') {
      queryBuilder
        .orderBy('product.salesCount', 'DESC')
        .addOrderBy('likesCount', 'DESC')
        .addOrderBy('product.viewCount', 'DESC')
        .addOrderBy('product.createdAt', 'DESC');
    } else if (sort === 'popular') {
      queryBuilder.orderBy('product.salesCount', 'DESC');
    } else if (sort === 'sales' || sort === 'sales_desc') {
      queryBuilder.orderBy('product.salesCount', 'DESC');
    } else if (sort === 'discount_desc' || sort === 'discount') {
      queryBuilder.orderBy('discountRate', 'DESC').addOrderBy('product.createdAt', 'DESC');
    } else if (sort === 'reviews' || sort === 'reviews_desc') {
      queryBuilder.orderBy('reviewCount', 'DESC');
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    const [products, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // 디버깅: 상품 조회 결과 로그
    console.log(`[ProductsService.findAll] Found ${products.length} products (total: ${total})`);
    if (products.length > 0) {
      console.log(`[ProductsService.findAll] First product:`, {
        id: products[0].id,
        name: products[0].name,
        brand: products[0].brand,
        isAvailable: products[0].isAvailable,
        isDeleted: products[0].isDeleted,
        recommendedColorSeason: products[0].recommendedColorSeason,
        recommendedBodyType: products[0].recommendedBodyType,
      });
    }

    // 평균 별점 집계 (페이지 내 상품들 대상)
    const ids = products.map(p => p.id);
    let ratingMap = new Map<string, number | null>();
    if (ids.length > 0) {
      const reviewRepo = this.productRepository.manager.getRepository(Review);
      const rows = await reviewRepo
        .createQueryBuilder('r')
        .select('r.productId', 'productId')
        .addSelect('AVG(r.rating)', 'avg')
        .where('r.productId IN (:...ids)', { ids })
        .groupBy('r.productId')
        .getRawMany();
      ratingMap = new Map(rows.map(row => [row.productId, row.avg != null ? Number(row.avg) : null]));
    }

    const lastPage = Math.ceil(total / limit);

    return {
      products: products.map(product => new ProductResponseDto(product, {
        likesCount: (product as any).likesCount ?? (product as any).product_likesCount ?? 0,
        reviewCount: (product as any).reviewsCount ?? (product as any).product_reviewsCount ?? 0,
        ratingAvg: ratingMap.get(product.id) ?? null,
      })),
      total,
      page,
      lastPage,
    };
  }

  async findPopularByGender(gender?: Gender): Promise<any> {
    const qbBase = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brandEntity', 'brand')
      .where('product.isDeleted = FALSE')
      // 임시로 isAvailable 조건 제거
      .orderBy('product.viewCount', 'DESC')
      .addOrderBy('product.createdAt', 'DESC')
      .take(10);

    if (gender) {
      const products = await qbBase
        .andWhere('product.recommendedGender = :gender', { gender })
        .getMany();
      return { products: products.map((p) => new ProductResponseDto(p)) };
    }

    const [male, female] = await Promise.all([
      qbBase.clone().andWhere('product.recommendedGender = :g1', { g1: Gender.MALE }).getMany(),
      qbBase.clone().andWhere('product.recommendedGender = :g2', { g2: Gender.FEMALE }).getMany(),
    ]);

    return {
      male: male.map((p) => new ProductResponseDto(p)),
      female: female.map((p) => new ProductResponseDto(p)),
    };
  }

  async findMainProducts(): Promise<{
    [ColorSeason.SPRING_BRIGHT]: ProductResponseDto | null;
    [ColorSeason.SPRING_LIGHT]: ProductResponseDto | null;
    [ColorSeason.SUMMER_LIGHT]: ProductResponseDto | null;
    [ColorSeason.SUMMER_MUTE]: ProductResponseDto | null;
    [ColorSeason.AUTUMN_MUTE]: ProductResponseDto | null;
    [ColorSeason.AUTUMN_DEEP]: ProductResponseDto | null;
    [ColorSeason.WINTER_DARK]: ProductResponseDto | null;
    [ColorSeason.WINTER_BRIGHT]: ProductResponseDto | null;
    [BodyType.STRAIGHT]: ProductResponseDto | null;
    [BodyType.WAVE]: ProductResponseDto | null;
    [BodyType.NATURAL]: ProductResponseDto | null;
  }> {
    const assignments = await this.getMainAssignmentsMap();

    const normalize = (k: string) => k.trim().replace(/\s+/g, ' ').toLowerCase();
    
    // 할당이 없을 때 자동으로 상품을 가져오는 헬퍼 함수
    const findByColorSeason = async (colorSeason: ColorSeason): Promise<ProductResponseDto | null> => {
      const product = assignments.get(normalize(colorSeason));
      if (product) {
        return new ProductResponseDto(product);
      }
      
      // 할당이 없으면 해당 컬러에 맞는 상품 자동 조회
      const fallbackProduct = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.brandEntity', 'brand')
        .where('product.isDeleted = FALSE')
        .andWhere('product.isAvailable = TRUE')
        .andWhere('product.recommendedColorSeason LIKE :colorSeason', {
          colorSeason: `%${colorSeason}%`,
        })
        .orderBy('product.viewCount', 'DESC')
        .addOrderBy('product.createdAt', 'DESC')
        .limit(1)
        .getOne();
      
      return fallbackProduct ? new ProductResponseDto(fallbackProduct) : null;
    };
    
    const findByBodyType = async (bodyType: BodyType): Promise<ProductResponseDto | null> => {
      // slotKey는 'Straight', 'Wave', 'Natural' 형태일 수 있으므로 여러 형태로 시도
      const possibleKeys = [
        normalize(bodyType),
        normalize(BodyType.STRAIGHT === bodyType ? 'Straight' : BodyType.WAVE === bodyType ? 'Wave' : 'Natural'),
      ];
      
      let product: Product | null = null;
      for (const key of possibleKeys) {
        product = assignments.get(key) || null;
        if (product) break;
      }
      
      if (product) {
        return new ProductResponseDto(product);
      }
      
      // 할당이 없으면 해당 체형에 맞는 상품 자동 조회
      const fallbackProduct = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.brandEntity', 'brand')
        .where('product.isDeleted = FALSE')
        .andWhere('product.isAvailable = TRUE')
        .andWhere('product.recommendedBodyType = :bodyType', { bodyType })
        .orderBy('product.viewCount', 'DESC')
        .addOrderBy('product.createdAt', 'DESC')
        .limit(1)
        .getOne();
      
      return fallbackProduct ? new ProductResponseDto(fallbackProduct) : null;
    };

    // 모든 조회를 병렬로 실행
    const [
      springBright,
      springLight,
      summerLight,
      summerMute,
      autumnMute,
      autumnDeep,
      winterDark,
      winterBright,
      straight,
      wave,
      natural,
    ] = await Promise.all([
      findByColorSeason(ColorSeason.SPRING_BRIGHT),
      findByColorSeason(ColorSeason.SPRING_LIGHT),
      findByColorSeason(ColorSeason.SUMMER_LIGHT),
      findByColorSeason(ColorSeason.SUMMER_MUTE),
      findByColorSeason(ColorSeason.AUTUMN_MUTE),
      findByColorSeason(ColorSeason.AUTUMN_DEEP),
      findByColorSeason(ColorSeason.WINTER_DARK),
      findByColorSeason(ColorSeason.WINTER_BRIGHT),
      findByBodyType(BodyType.STRAIGHT),
      findByBodyType(BodyType.WAVE),
      findByBodyType(BodyType.NATURAL),
    ]);

    return {
      [ColorSeason.SPRING_BRIGHT]: springBright,
      [ColorSeason.SPRING_LIGHT]: springLight,
      [ColorSeason.SUMMER_LIGHT]: summerLight,
      [ColorSeason.SUMMER_MUTE]: summerMute,
      [ColorSeason.AUTUMN_MUTE]: autumnMute,
      [ColorSeason.AUTUMN_DEEP]: autumnDeep,
      [ColorSeason.WINTER_DARK]: winterDark,
      [ColorSeason.WINTER_BRIGHT]: winterBright,
      [BodyType.STRAIGHT]: straight,
      [BodyType.WAVE]: wave,
      [BodyType.NATURAL]: natural,
    }
  }

    async findAllForAdmin(options: {
    page?: number;
    limit?: number;
    sort?: string;
    bodyType?: BodyType;
    search?: string;
  }): Promise<{ products: ProductResponseDto[]; total: number; page: number; lastPage: number }> {
    const {
      page = 1,
      limit = 100, // 관리자 페이지에서는 더 많은 상품을 한 번에 표시
      sort = 'latest',
      bodyType,
      search,
    } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepository.createQueryBuilder('product');
    // 브랜드 조인 (leftJoin으로 브랜드가 없어도 조회 가능)
    queryBuilder.leftJoinAndSelect('product.brandEntity', 'brand');

    // 필터링 조건 적용
    if (bodyType) {
      queryBuilder.andWhere('product.recommendedBodyType = :bodyType', { bodyType });
    }

    // UI-038: 대소문자 구분 없이 검색
    if (search) {
      const normalizedSearch = search.toLowerCase();
      queryBuilder.andWhere(
        '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search OR LOWER(product.brand) LIKE :search)',
        { search: `%${normalizedSearch}%` },
      );
    }

    // 삭제되지 않은 상품만 조회 (isAvailable 필터링 없음 - 승인 대기 + 판매 중 모두 포함)
    queryBuilder.andWhere('product.isDeleted = FALSE');
    
    // 디버깅: 전체 상품 수 확인 (필터링 전)
    const totalBeforeFilter = await this.productRepository.count({
      where: { isDeleted: false },
    });
    console.log(`[findAllForAdmin] 전체 상품 수 (삭제 제외): ${totalBeforeFilter}`);

    // 정렬 방식 적용
    if (sort === 'latest') {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    } else {
      queryBuilder.orderBy('product.createdAt', 'ASC');
    }

    // 디버깅: 쿼리 빌더의 SQL 확인
    const sql = queryBuilder.getSql();
    const params = queryBuilder.getParameters();
    console.log(`[findAllForAdmin] SQL:`, sql);
    console.log(`[findAllForAdmin] Parameters:`, params);

    const [products, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    console.log(`[findAllForAdmin] 조회된 상품 수: ${products.length}, 전체: ${total}`);
    console.log(`[findAllForAdmin] isAvailable 상태별 개수:`, {
      available: products.filter(p => p.isAvailable).length,
      pending: products.filter(p => !p.isAvailable).length,
    });
    
    // 각 상품의 상세 정보 로깅
    products.forEach((p, idx) => {
      console.log(`[findAllForAdmin] 상품 ${idx + 1}:`, {
        id: p.id,
        name: p.name,
        isAvailable: p.isAvailable,
        brandId: p.brandEntity?.id || '없음',
        brandName: p.brandEntity?.name || '없음',
        brandColumn: p.brand || '없음',
        isDeleted: p.isDeleted,
      });
    });
    
    // 특정 상품 검색 (디버깅용)
    const searchProduct = products.find(p => p.name === 'ttt' || p.id === '911f6a77-f69d-47ce-8b96-79e826fec6d3');
    if (searchProduct) {
      console.log(`[findAllForAdmin] 찾은 상품:`, {
        id: searchProduct.id,
        name: searchProduct.name,
        isAvailable: searchProduct.isAvailable,
        brandId: searchProduct.brandEntity?.id,
        brandName: searchProduct.brandEntity?.name,
      });
    } else {
      console.log(`[findAllForAdmin] 'ttt' 상품을 현재 페이지에서 찾을 수 없습니다.`);
      // DB에서 직접 확인
      const directCheck = await this.productRepository.findOne({
        where: [
          { name: 'ttt', isDeleted: false },
          { id: '911f6a77-f69d-47ce-8b96-79e826fec6d3', isDeleted: false }
        ],
        relations: ['brandEntity'],
      });
      if (directCheck) {
        console.log(`[findAllForAdmin] DB에서 직접 조회한 'ttt' 상품:`, {
          id: directCheck.id,
          name: directCheck.name,
          isAvailable: directCheck.isAvailable,
          isDeleted: directCheck.isDeleted,
          brandId: directCheck.brandEntity?.id,
          brandName: directCheck.brandEntity?.name,
          createdAt: directCheck.createdAt,
        });
      } else {
        console.log(`[findAllForAdmin] DB에서도 'ttt' 상품을 찾을 수 없습니다.`);
        // 삭제된 상품도 포함해서 확인
        const deletedCheck = await this.productRepository.findOne({
          where: [
            { name: 'ttt' },
            { id: '911f6a77-f69d-47ce-8b96-79e826fec6d3' }
          ],
          relations: ['brandEntity'],
        });
        if (deletedCheck) {
          console.log(`[findAllForAdmin] 삭제된 상품으로 발견:`, {
            id: deletedCheck.id,
            name: deletedCheck.name,
            isAvailable: deletedCheck.isAvailable,
            isDeleted: deletedCheck.isDeleted,
            brandId: deletedCheck.brandEntity?.id,
            brandName: deletedCheck.brandEntity?.name,
            createdAt: deletedCheck.createdAt,
          });
        }
      }
    }

    const lastPage = Math.ceil(total / limit);

    return {
      products: products.map(product => new ProductResponseDto(product)),
      total,
      page,
      lastPage,
    };
  }

  async findOne(id: string): Promise<ProductDetailResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['brandEntity', 'reviews'],
    });

    if (!product) {
      throw new NotFoundException(`상품 ID ${id}를 찾을 수 없습니다.`);
    }

    // 조회수 증가
    product.viewCount += 1;
    await this.productRepository.save(product);

    return new ProductDetailResponseDto(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    mainImage?: Express.Multer.File[],
    additionalImages?: Express.Multer.File[],
  ): Promise<ProductDetailResponseDto> {
    const product = await this.findOne(id);

    const { removeImageUrls } = updateProductDto;
    
    // DTO 데이터 업데이트
    const updatedProduct = this.productRepository.create({
      ...product,
      ...updateProductDto,
      ...(updateProductDto.brandId && { brandEntity: { id: updateProductDto.brandId } }),
    });

    if (mainImage && mainImage.length > 0) {
      console.log(mainImage);
      const mainImageUrl = await this.filesService.uploadFile(mainImage[0], 'products');
      updatedProduct.imageUrl = mainImageUrl;
    }
    if (removeImageUrls && removeImageUrls.length > 0) {
      updatedProduct.additionalImageUrls = updatedProduct.additionalImageUrls.filter(url => !removeImageUrls.includes(url));
    }

    if (additionalImages && additionalImages.length > 0) {
      const additionalImageUrls = await Promise.all(
        additionalImages.map(image => this.filesService.uploadFile(image, 'products'))
      );
      updatedProduct.additionalImageUrls = additionalImageUrls;
    }
    
    const savedProduct = await this.productRepository.save(updatedProduct);
    return new ProductDetailResponseDto(savedProduct);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isDeleted = true;
    await this.productRepository.save(product);
  }

  async findByColorSeason(
    colorSeason: ColorSeason,
    options: { page?: number; limit?: number },
  ): Promise<{ products: ProductResponseDto[]; total: number; page: number; lastPage: number }> {
    return this.findAll({
      ...options,
      colorSeasons: [colorSeason],
    });
  }

  async findByBodyType(
    bodyType: BodyType,
    options: { page?: number; limit?: number },
  ): Promise<{ products: ProductResponseDto[]; total: number; page: number; lastPage: number }> {
    return this.findAll({
      ...options,
      bodyType,
    });
  }

  async findLatestShippingInfoByBrand(
    brandId: string,
  ): Promise<{
    shippingFee: number | null;
    freeShippingAmount: number | null;
    refundAddress: string | null;
    returnReason1: string | null;
    returnReason2: string | null;
  }> {
    const product = await this.productRepository.findOne({
      where: { brandId },
      order: { createdAt: 'DESC' },
    });

    if (!product) {
      throw new NotFoundException('해당 브랜드의 상품을 찾을 수 없습니다.');
    }

    const refundInfo = (product.refundInfo ?? {}) as Record<string, any>;

    return {
      shippingFee: product.shippingFee ?? null,
      freeShippingAmount: product.freeShippingAmount ?? null,
      refundAddress: (refundInfo.address as string | null) ?? null,
      returnReason1: (refundInfo.returnReason1 as string | null) ?? null,
      returnReason2: (refundInfo.returnReason2 as string | null) ?? null,
    };
  }

  async tryOn(
    tryOnRequestDto: TryOnRequestDto,
    userImage: Express.Multer.File,
  ): Promise<TryOnResponseDto> {
    const productId = tryOnRequestDto.productId;
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    
    if (!product) {
      throw new NotFoundException(`상품 ID ${productId}를 찾을 수 없습니다.`);
    }
    
    if (!product.imageUrl) {
      throw new BadRequestException('상품 이미지가 없습니다.');
    }
    
    // 사용자 이미지 업로드
    const userImageUrl = await this.filesService.uploadFile(userImage, 'try-on');
    
    try {
      // fashn.ai API 호출
      const fashnApiKey = this.configService.get<string>('FASHN_AI_API_KEY');
      if (!fashnApiKey) {
        throw new BadRequestException('FASHN AI API 키가 설정되지 않았습니다.');
      }
      
      const category = tryOnRequestDto.category || this.determineCategoryFromProduct(product);
      
      // 1단계: 가상 착용 요청 생성
      const runResponse = await axios.post(
        'https://api.fashn.ai/v1/run',
        {
          model_name: "tryon-v1.6",
          inputs: {
            model_image: userImageUrl,
            garment_image: product.imageUrl,
            mode: 'quality',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${fashnApiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log('Run 응답:', runResponse.data);
      
      // 처리 ID 추출
      const predictionId = runResponse.data.id;
      if (!predictionId) {
        throw new BadRequestException('시착 요청 ID를 받지 못했습니다.');
      }
      
      // 2단계: 결과 폴링
      const maxRetries = 30; // 최대 30회 시도
      const pollingInterval = 2000; // 2초마다 폴링
      
      // 폴링 함수 정의
      const pollStatus = async () => {
        let retries = 0;
        
        while (retries < maxRetries) {
          try {
            const statusResponse = await axios.get(
              `https://api.fashn.ai/v1/status/${predictionId}`,
              {
                headers: {
                  'Authorization': `Bearer ${fashnApiKey}`,
                }
              }
            );
            
            console.log('상태 확인:', statusResponse.data);
            
            const status = statusResponse.data.status;
            
            // 실패 상태 확인
            if (status === 'failed') {
              throw new BadRequestException(
                `시착 처리 실패: ${statusResponse.data.error || '알 수 없는 오류'}`
              );
            }
            
            // 완료 상태 확인
            if (status === 'completed') {
              const outputs = statusResponse.data.output;
              if (!outputs || outputs.length === 0) {
                throw new BadRequestException('결과 이미지를 받지 못했습니다.');
              }
              
              // 임시 파일 삭제 (선택적)
              await this.filesService.deleteFile(userImageUrl);
              
              return {
                resultImageUrl: outputs[0],
                tryOnId: predictionId
              };
            }
            
            // 아직 처리 중이면 대기
            await new Promise(resolve => setTimeout(resolve, pollingInterval));
            retries++;
          } catch (error) {
            if (error instanceof BadRequestException) {
              throw error;
            }
            
            // 네트워크 오류 등은 재시도
            console.error('폴링 중 오류:', error);
            await new Promise(resolve => setTimeout(resolve, pollingInterval));
            retries++;
          }
        }
        
        throw new BadRequestException(
          `시착 처리 시간 초과: ${maxRetries * pollingInterval / 1000}초 내에 처리되지 않았습니다.`
        );
      };
      
      // 폴링 시작
      return await pollStatus();
    } catch (error) {
      // 업로드된 임시 파일 삭제 시도
      try {
        await this.filesService.deleteFile(userImageUrl);
      } catch (deleteError) {
        console.error('임시 파일 삭제 실패:', deleteError);
      }
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(
        `시착 처리 중 오류가 발생했습니다: ${error.message || error}`
      );
    }
  }
  
  private determineCategoryFromProduct(product: Product): string {
    // 제품 정보를 기반으로 카테고리 추론
    // 이 부분은 실제 제품 데이터 구조에 맞게 구현해야 함
    if (product.description?.toLowerCase().includes('shirt') || 
        product.description?.toLowerCase().includes('top')) {
      return 'tops';
    } else if (product.description?.toLowerCase().includes('dress')) {
      return 'dresses';
    } else if (product.description?.toLowerCase().includes('jacket') || 
               product.description?.toLowerCase().includes('coat')) {
      return 'outerwear';
    } else if (product.description?.toLowerCase().includes('pant') || 
               product.description?.toLowerCase().includes('jeans')) {
      return 'bottoms';
    }
    
    // 기본값
    return 'tops';
  }

  async findByBrandId(
    brandId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: string;
    } = {},
  ): Promise<{ products: ProductResponseDto[]; total: number; page: number; lastPage: number }> {
    const { page = 1, limit = 12, sort = 'latest' } = options;
    
    const queryBuilder = this.productRepository.createQueryBuilder('product');
    queryBuilder.leftJoinAndSelect('product.brandEntity', 'brand');
    queryBuilder.where('product.brandId = :brandId', { brandId });

    queryBuilder.andWhere('product.isDeleted = FALSE');

    // 집계 컬럼: 찜/리뷰 수
    queryBuilder.addSelect(
      (sub) => sub.select('COUNT(*)').from(ProductLike, 'pl').where('pl.productId = product.id'),
      'likesCount',
    );
    queryBuilder.addSelect(
      (sub) => sub.select('COUNT(*)').from('review', 'r').where('r.productId = product.id'),
      'reviewCount',
    );
    queryBuilder.loadRelationCountAndMap('product.likesCount', 'product.productLikes');
    queryBuilder.loadRelationCountAndMap('product.reviewsCount', 'product.reviews');
    // 할인율 별칭 컬럼 (NULL/0 보호)
    queryBuilder.addSelect(
      `CASE WHEN product.originalPriceKr IS NULL OR product.originalPriceKr = 0
            THEN 0
            ELSE (product.originalPriceKr - product.price) / product.originalPriceKr END`,
      'discountRate',
    );

    // 정렬 방식 적용
    if (sort === 'price_asc') {
      queryBuilder.orderBy('product.price', 'ASC');
    } else if (sort === 'price_desc') {
      queryBuilder.orderBy('product.price', 'DESC');
    } else if (sort === 'recommended') {
      queryBuilder
        .orderBy('product.salesCount', 'DESC')
        .addOrderBy('likesCount', 'DESC')
        .addOrderBy('product.viewCount', 'DESC')
        .addOrderBy('product.createdAt', 'DESC');
    } else if (sort === 'popular') {
      queryBuilder.orderBy('product.salesCount', 'DESC');
    } else if (sort === 'sales' || sort === 'sales_desc') {
      queryBuilder.orderBy('product.salesCount', 'DESC');
    } else if (sort === 'discount_desc' || sort === 'discount') {
      queryBuilder.orderBy('discountRate', 'DESC').addOrderBy('product.createdAt', 'DESC');
    } else if (sort === 'reviews' || sort === 'reviews_desc') {
      queryBuilder.orderBy('reviewCount', 'DESC');
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    const skip = (page - 1) * limit;
    const [products, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // 평균 별점 집계 (페이지 내 상품들 대상)
    const ids = products.map(p => p.id);
    let ratingMap = new Map<string, number | null>();
    if (ids.length > 0) {
      const reviewRepo = this.productRepository.manager.getRepository(Review);
      const rows = await reviewRepo
        .createQueryBuilder('r')
        .select('r.productId', 'productId')
        .addSelect('AVG(r.rating)', 'avg')
        .where('r.productId IN (:...ids)', { ids })
        .groupBy('r.productId')
        .getRawMany();
      ratingMap = new Map(rows.map(row => [row.productId, row.avg != null ? Number(row.avg) : null]));
    }

    const lastPage = Math.ceil(total / limit);

    return {
      products: products.map(product => new ProductResponseDto(product, {
        likesCount: (product as any).likesCount ?? (product as any).product_likesCount ?? 0,
        reviewCount: (product as any).reviewsCount ?? (product as any).product_reviewsCount ?? 0,
        ratingAvg: ratingMap.get(product.id) ?? null,
      })),
      total,
      page,
      lastPage,
    };
  }

  async likeProduct(productId: string, user: User): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`상품 ID ${productId}를 찾을 수 없습니다.`);
    }
    const existing = await this.productLikeRepository.findOne({ where: { productId, userId: user.id } });
    if (existing) {
      throw new BadRequestException('이미 찜한 상품입니다.');
    }
    const like = this.productLikeRepository.create({ product, productId, user, userId: user.id });
    await this.productLikeRepository.save(like);
  }

  async unlikeProduct(productId: string, user: User): Promise<void> {
    const existing = await this.productLikeRepository.findOne({ where: { productId, userId: user.id } });
    if (!existing) {
      throw new NotFoundException('찜하지 않은 상품입니다.');
    }
    await this.productLikeRepository.remove(existing);
  }

  /**
   * 특정 사용자가 찜한 상품 목록을 페이지네이션하여 반환합니다.
   */
  async findLikedProducts(
    user: User,
    options: { page?: number; limit?: number } = {},
  ): Promise<{ products: ProductResponseDto[]; total: number; page: number; lastPage: number }> {
    const { page = 1, limit = 12 } = options;
    const skip = (page - 1) * limit;

    // 사용자 찜 정보를 조회하면서 product 관계를 함께 로드
    const [likes, total] = await this.productLikeRepository.findAndCount({
      where: { userId: user.id },
      relations: ['product'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Product가 삭제되었을 수 있으므로 필터링
    const products = likes
      .filter((like) => !!like.product && !like.product.isDeleted)
      .map((like) => new ProductResponseDto(like.product));

    const lastPage = Math.ceil(total / limit);

    return { products, total, page, lastPage };
  }
} 