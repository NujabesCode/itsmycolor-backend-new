import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Brand, BrandStatus } from './entities/brand.entity';
import { BrandLike } from './entities/brand-like.entity';
import { User } from '../users/entities/user.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandResponseDto } from './dto/brand-response.dto';
import { FilesService } from '../files/files.service';
import { PaginationDto, PaginatedResponseDto } from './dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { BrandConnectToken } from './entities/brand-connect-token.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateBrandStatusDto } from './dto/update-brand-status.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(BrandLike)
    private brandLikeRepository: Repository<BrandLike>,
    @InjectRepository(BrandConnectToken)
    private brandConnectTokenRepository: Repository<BrandConnectToken>,
    private filesService: FilesService,
    private usersService: UsersService,
    private notificationsService: NotificationsService, // SM-013, SM-014, SM-015: 알림 발송
  ) {}

  async create(createBrandDto: CreateBrandDto, files?: { logo?: Express.Multer.File[], background?: Express.Multer.File[], brandPdf?: Express.Multer.File[] }): Promise<BrandResponseDto> {
    const user = await this.usersService.findByEmail('brand-pending@itsmycolorshop.com');
    if (!user) {
      throw new NotFoundException('임시 브랜드 저장 사용자를 찾을 수 없습니다.');
    }
    console.log(createBrandDto);
    createBrandDto['userId'] = user.id;

    // recommendedColors가 문자열인 경우 처리
    if (createBrandDto.recommendedColors && typeof createBrandDto.recommendedColors === 'string') {
      try {
        createBrandDto.recommendedColors = JSON.parse(createBrandDto.recommendedColors as any);
      } catch (e) {
        createBrandDto.recommendedColors = {};
      }
    }

    const brand = this.brandRepository.create({
      ...createBrandDto,
      status: BrandStatus.PENDING,
    });

    if (files?.logo && files.logo.length > 0) {
      const logoUrl = await this.filesService.uploadFile(files.logo[0], 'brands/logos');
      brand.logoUrl = logoUrl;
    }

    if (files?.background && files.background.length > 0) {
      const backgroundUrl = await this.filesService.uploadFile(files.background[0], 'brands/backgrounds');
      brand.backgroundUrl = backgroundUrl;
    }

    if (files?.brandPdf && files.brandPdf.length > 0) {
      const brandPdfUrl = await this.filesService.uploadFile(files.brandPdf[0], 'brands/brandPdfs');
      brand.brandPdfUrl = brandPdfUrl;
    }

    const savedBrand = await this.brandRepository.save(brand);
    return new BrandResponseDto(savedBrand);
  }

  async findAllForAdmin(status?: BrandStatus): Promise<BrandResponseDto[]> {
    const queryBuilder = this.brandRepository
      .createQueryBuilder('brand')
      .leftJoinAndSelect('brand.products', 'products');

    if (status) {
      queryBuilder.andWhere('brand.status = :status', { status });
    }

    queryBuilder.orderBy('brand.createdAt', 'DESC');

    const brands = await queryBuilder.getMany();

    return brands.map((brand) => new BrandResponseDto(brand));
  }

  async findOne(id: string): Promise<BrandResponseDto> {
    const brand = await this.brandRepository.findOne({ 
      where: { id },
      relations: ['brandLikes'],
    });
    
    if (!brand) {
      throw new NotFoundException(`브랜드 ID ${id}를 찾을 수 없습니다.`);
    }
    return new BrandResponseDto(brand);
  }
  async findByUserId(userId: string, paginationDto: PaginationDto): Promise<PaginatedResponseDto<BrandResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [brands, totalItems] = await this.brandRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: brands.map(brand => new BrandResponseDto(brand)),
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findByUserIdWithoutPagination(userId: string) {
    return await this.brandRepository.findOne({ where: { userId } });
  }

  async update(id: string, updateBrandDto: UpdateBrandDto, files?: { logo?: Express.Multer.File[], background?: Express.Multer.File[] }): Promise<BrandResponseDto> {
    const brand = await this.findOne(id);

    // recommendedColors가 문자열인 경우 처리
    if (updateBrandDto.recommendedColors && typeof updateBrandDto.recommendedColors === 'string') {
      try {
        updateBrandDto.recommendedColors = JSON.parse(updateBrandDto.recommendedColors as any);
      } catch (e) {
        updateBrandDto.recommendedColors = {};
      }
    }

    // 파일 업로드 처리
    if (files?.logo && files.logo.length > 0) {
      if (brand.logoUrl) {
        await this.filesService.deleteFile(brand.logoUrl);
      }
      const logoUrl = await this.filesService.uploadFile(files.logo[0], 'brands/logos');
      updateBrandDto = { ...updateBrandDto, logoUrl };
    }

    if (files?.background && files.background.length > 0) {
      if (brand.backgroundUrl) {
        await this.filesService.deleteFile(brand.backgroundUrl);
      }
      const backgroundUrl = await this.filesService.uploadFile(files.background[0], 'brands/backgrounds');
      updateBrandDto = { ...updateBrandDto, backgroundUrl };
    }

    await this.brandRepository.update(id, updateBrandDto);
    
    return this.findOne(id);
  }

  // SM-006, SM-007, SM-012, SM-013, SM-014: 반려 사유 저장, 알림 발송, 변경 이력 저장
  async updateStatus(
    id: string, 
    statusDto: UpdateBrandStatusDto,
    adminName?: string
  ): Promise<BrandResponseDto> {
    // 실제 Brand 엔티티를 가져와서 changeHistory와 userId에 접근
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`브랜드 ID ${id}를 찾을 수 없습니다.`);
    }
    
    const previousStatus = brand.status;

    // SM-006, SM-007: 반려 시 반려 사유 필수
    if (statusDto.status === BrandStatus.REJECTED && !statusDto.rejectionReason) {
      throw new BadRequestException('반려 사유를 입력해주세요.');
    }

    // 변경 이력 가져오기
    const changeHistory = (brand.changeHistory as any) || [];
    
    // 변경 이력 추가 (SM-012)
    changeHistory.push({
      date: new Date(),
      adminName: adminName || '시스템',
      action: statusDto.status === BrandStatus.APPROVED ? '승인' 
        : statusDto.status === BrandStatus.REJECTED ? '반려'
        : statusDto.status === BrandStatus.REAPPLY ? '재심사 요청'
        : '상태 변경',
      reason: statusDto.rejectionReason || statusDto.sanctionReason || undefined,
      status: statusDto.status,
    });

    // 업데이트할 데이터 준비
    const updateData: any = {
      status: statusDto.status,
      changeHistory,
    };

    // 반려 사유 저장
    if (statusDto.status === BrandStatus.REJECTED && statusDto.rejectionReason) {
      updateData.rejectionReason = statusDto.rejectionReason;
    }

    // 제재 사유 저장 (SM-010)
    if (statusDto.sanctionReason) {
      updateData.sanctionReason = statusDto.sanctionReason;
    }

    await this.brandRepository.update(id, updateData);
    const updatedBrand = await this.findOne(id);

    // SM-013, SM-014, SM-015: 알림 발송
    if (brand.userId) {
      try {
        if (statusDto.status === BrandStatus.APPROVED) {
          await this.notificationsService.create({
            userId: brand.userId,
            title: '브랜드 입점 승인',
            content: `축하합니다! ${brand.name} 브랜드 입점이 승인되었습니다. 이제 상품을 등록하고 판매를 시작할 수 있습니다.`,
          });
        } else if (statusDto.status === BrandStatus.REJECTED) {
          await this.notificationsService.create({
            userId: brand.userId,
            title: '브랜드 입점 반려',
            content: `안타깝게도 ${brand.name} 브랜드 입점 신청이 반려되었습니다.\n반려 사유: ${statusDto.rejectionReason}\n\n재신청을 원하시면 새로운 정보로 다시 신청해주세요.`,
          });
        }
      } catch (error) {
        console.error('알림 발송 실패:', error);
        // 알림 발송 실패해도 상태 변경은 완료되도록 함
      }
    }

    return updatedBrand;
  }

  async remove(id: string): Promise<void> {
    const brand = await this.findOne(id);
    
    // 이미지 파일 삭제 (로고와 배경 이미지 URL이 유효한 경우에만)
    try {
      if (brand.logoUrl && brand.logoUrl.trim() !== '') {
        await this.filesService.deleteFile(brand.logoUrl);
      }
      
      if (brand.backgroundUrl && brand.backgroundUrl.trim() !== '') {
        await this.filesService.deleteFile(brand.backgroundUrl);
      }
    } catch (error) {
      console.error(`파일 삭제 중 오류 발생: ${error.message}`);
      // 파일 삭제 실패해도 브랜드 삭제는 계속 진행
    }
    
    await this.brandRepository.delete(id);
  }

  /**
   * 브랜드 찜
   */
  async likeBrand(brandId: string, user: User): Promise<void> {
    const brand = await this.brandRepository.findOne({ where: { id: brandId } });
    if (!brand) {
      throw new NotFoundException(`브랜드 ID ${brandId}를 찾을 수 없습니다.`);
    }
    const existing = await this.brandLikeRepository.findOne({ where: { brandId, userId: user.id } });
    if (existing) {
      throw new BadRequestException('이미 찜한 브랜드입니다.');
    }
    const like = this.brandLikeRepository.create({ brand, brandId, user, userId: user.id });
    await this.brandLikeRepository.save(like);
  }

  /**
   * 브랜드 찜 취소
   */
  async unlikeBrand(brandId: string, user: User): Promise<void> {
    const existing = await this.brandLikeRepository.findOne({ where: { brandId, userId: user.id } });
    if (!existing) {
      throw new NotFoundException('찜하지 않은 브랜드입니다.');
    }
    await this.brandLikeRepository.remove(existing);
  }

  async createBrandConnectUrl(brandId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');

    const brand = await this.brandRepository.findOne({ where: { id: brandId } });
    if (!brand) {
      throw new NotFoundException(`브랜드 ID ${brandId}를 찾을 수 없습니다.`);
    }

    await this.brandConnectTokenRepository.delete({ brandId });

    const fiveDayLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const brandConnectToken = this.brandConnectTokenRepository.create({ brand, token, expiredAt: fiveDayLater });
    await this.brandConnectTokenRepository.save(brandConnectToken);

    return `${process.env.FRONTEND_URL}/seller/sign-up?token=${token}`;
  }

  async brandConnect(token: string, userId: string): Promise<void> {
    const brandConnectToken = await this.brandConnectTokenRepository.findOne({ where: { token } });
    if (!brandConnectToken) {
      throw new NotFoundException(`토큰 ${token}를 찾을 수 없습니다.`);
    }

    if (brandConnectToken.expiredAt < new Date()) {
      await this.brandConnectTokenRepository.delete({ id: brandConnectToken.id });
      throw new BadRequestException('토큰이 만료되었습니다.');
    }

    const brandId = brandConnectToken.brandId;

    const brand = await this.brandRepository.findOne({ where: { id: brandId } });
    if (!brand) {
      throw new NotFoundException(`브랜드 ID ${brandId}를 찾을 수 없습니다.`);
    }

    await this.brandRepository.update(brandId, { userId });
    await this.brandConnectTokenRepository.delete({ id: brandConnectToken.id });
  }
}