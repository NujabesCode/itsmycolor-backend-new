import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner, BannerVisibility } from './entities/banner.entity';
import { BannerListQueryDto, CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner) private readonly bannerRepo: Repository<Banner>,
  ) {}

  async create(dto: CreateBannerDto): Promise<Banner> {
    // 비공개면 우선순위는 0으로 강제
    const isPublic = dto.visibility === BannerVisibility.PUBLIC;
    if (isPublic && (!dto.priority || dto.priority < 1 || dto.priority > 5)) {
      throw new BadRequestException('공개 배너는 우선순위(1~5)가 필수입니다.');
    }

    // 정규화: 현재 최대 우선순위를 조회하여, 요청 우선순위가 max+1보다 크면 max+1로 조정
    let finalPriority = isPublic ? Math.min(5, Math.max(1, dto.priority!)) : 0;
    if (isPublic) {
      const maxBanner = await this.bannerRepo.findOne({
        where: { visibility: BannerVisibility.PUBLIC },
        order: { priority: 'DESC' },
      });
      const maxPriority = maxBanner?.priority ?? 0;
      // 요청한 priority가 max+1보다 크면 max+1로 조정 (단, 5를 넘지 않도록)
      if (finalPriority > maxPriority + 1) {
        finalPriority = Math.min(5, maxPriority + 1);
      }
    }

    const entity = this.bannerRepo.create({
      title: dto.title,
      subtitle: dto.subtitle ?? null,
      visibility: dto.visibility,
      priority: finalPriority,
      imagePcUrl: dto.imagePcUrl ?? null,
      imageMobileUrl: dto.imageMobileUrl ?? null,
      linkUrl: dto.linkUrl ?? null,
    });

    const saved = await this.bannerRepo.save(entity);

    if (!isPublic) return saved;

    // 삽입·밀기 로직 (1~5 슬롯)
    await this.bannerRepo.manager.transaction(async (trx) => {
      const repo = trx.getRepository(Banner);
      const order = saved.priority;
      await repo
        .createQueryBuilder()
        .update(Banner)
        .set({ priority: () => 'priority + 1' as any })
        .where('id <> :id AND visibility = :vis AND priority >= :order AND priority BETWEEN 1 AND 5', {
          id: saved.id,
          vis: BannerVisibility.PUBLIC,
          order,
        })
        .execute();

      await repo.update({ id: saved.id }, { priority: order });

      await repo
        .createQueryBuilder()
        .update(Banner)
        .set({ priority: 0 as any })
        .where('visibility = :vis AND priority > 5', { vis: BannerVisibility.PUBLIC })
        .execute();
    });

    return this.findOne(saved.id);
  }

  async findAll(query: BannerListQueryDto): Promise<{ items: Banner[]; total: number; page: number; totalPages: number }>{
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const qb = this.bannerRepo.createQueryBuilder('banner');

    // 정렬 규칙: 공개 우선(우선순위>0 → priority ASC → 나머지 공개는 updatedAt DESC) → 비공개 updatedAt DESC
    qb
      .orderBy("CASE WHEN banner.visibility = 'public' THEN 0 ELSE 1 END", 'ASC')
      .addOrderBy("CASE WHEN banner.visibility = 'public' AND banner.priority > 0 THEN 0 WHEN banner.visibility = 'public' THEN 1 ELSE 2 END", 'ASC')
      .addOrderBy('banner.priority', 'ASC')
      .addOrderBy('banner.updatedAt', 'DESC');

    const [items, total] = await qb.take(limit).skip((page - 1) * limit).getManyAndCount();
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Banner> {
    const item = await this.bannerRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('배너를 찾을 수 없습니다.');
    return item;
  }

  // 메인 노출용 공개 배너(1~5순위) 조회
  async findPublicForHome(): Promise<Banner[]> {
    return this.bannerRepo
      .createQueryBuilder('banner')
      .where('banner.visibility = :vis', { vis: BannerVisibility.PUBLIC })
      .andWhere('banner.priority BETWEEN 1 AND 5')
      .orderBy('banner.priority', 'ASC')
      .addOrderBy('banner.updatedAt', 'DESC')
      .getMany();
  }

  async update(id: number, dto: UpdateBannerDto): Promise<Banner> {
    const current = await this.findOne(id);

    const visibility = dto.visibility ?? current.visibility;
    let priority = dto.priority ?? current.priority;

    // 비공개로 변경되면 우선순위는 0으로 강제
    if (visibility === BannerVisibility.PRIVATE) {
      priority = 0;
    } else {
      // 공개인데 우선순위 미입력/범위 밖이면 오류
      if (!priority || priority < 1 || priority > 5) {
        throw new BadRequestException('공개 배너는 우선순위(1~5)가 필수입니다.');
      }
    }

    const baseUpdate: Partial<Banner> = {
      title: dto.title ?? current.title,
      subtitle: dto.subtitle ?? current.subtitle,
      visibility,
      imagePcUrl: dto.imagePcUrl ?? current.imagePcUrl,
      imageMobileUrl: dto.imageMobileUrl ?? current.imageMobileUrl,
      linkUrl: dto.linkUrl ?? current.linkUrl,
    };

    await this.bannerRepo.update(id, baseUpdate);

    // 우선순위 변경 처리
    if (visibility === BannerVisibility.PRIVATE) {
      if (current.priority !== 0) {
        await this.bannerRepo.update(id, { priority: 0 });
      }
      return this.findOne(id);
    }

    if (current.priority === priority) {
      // 위치 동일 → 단순 반환
      return this.findOne(id);
    }

    let validated = Math.min(5, Math.max(1, priority));

    // 정규화: 현재 최대 우선순위를 조회하여, 요청 우선순위가 max+1보다 크면 max+1로 조정
    const maxBanner = await this.bannerRepo.findOne({
      where: { visibility: BannerVisibility.PUBLIC },
      order: { priority: 'DESC' },
    });
    const maxPriority = maxBanner?.priority ?? 0;
    if (validated > maxPriority + 1) {
      validated = Math.min(5, maxPriority + 1);
    }

    await this.bannerRepo.manager.transaction(async (trx) => {
      const repo = trx.getRepository(Banner);

      await repo
        .createQueryBuilder()
        .update(Banner)
        .set({ priority: () => 'priority + 1' as any })
        .where('id <> :id AND visibility = :vis AND priority >= :order AND priority BETWEEN 1 AND 5', {
          id,
          vis: BannerVisibility.PUBLIC,
          order: validated,
        })
        .execute();

      await repo.update({ id }, { priority: validated });

      await repo
        .createQueryBuilder()
        .update(Banner)
        .set({ priority: 0 as any })
        .where('visibility = :vis AND priority > 5', { vis: BannerVisibility.PUBLIC })
        .execute();
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.bannerRepo.delete(id);
  }

  async updatePriority(id: number, newPriority: number): Promise<Banner> {
    const item = await this.findOne(id);
    if (item.visibility !== BannerVisibility.PUBLIC) {
      // 비공개에선 0 고정
      await this.bannerRepo.update(id, { priority: 0 });
      return this.findOne(id);
    }

    let validated = Math.min(5, Math.max(1, Number(newPriority) || 1));

    // 정규화: 현재 최대 우선순위를 조회하여, 요청 우선순위가 max+1보다 크면 max+1로 조정
    const maxBanner = await this.bannerRepo.findOne({
      where: { visibility: BannerVisibility.PUBLIC },
      order: { priority: 'DESC' },
    });
    const maxPriority = maxBanner?.priority ?? 0;
    if (validated > maxPriority + 1) {
      validated = Math.min(5, maxPriority + 1);
    }

    await this.bannerRepo.manager.transaction(async (trx) => {
      const repo = trx.getRepository(Banner);

      await repo
        .createQueryBuilder()
        .update(Banner)
        .set({ priority: () => 'priority + 1' as any })
        .where('id <> :id AND visibility = :vis AND priority >= :order AND priority BETWEEN 1 AND 5', {
          id,
          vis: BannerVisibility.PUBLIC,
          order: validated,
        })
        .execute();

      await repo.update({ id }, { priority: validated });

      await repo
        .createQueryBuilder()
        .update(Banner)
        .set({ priority: 0 as any })
        .where('visibility = :vis AND priority > 5', { vis: BannerVisibility.PUBLIC })
        .execute();
    });

    return this.findOne(id);
  }
}


