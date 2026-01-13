import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MainSectionAssignment } from './entities/main-section-assignment.entity';
import { ReplaceAssignmentDto, UpsertAssignmentDto } from './dto/main-section.dto';
import { Product } from '../products/entities/product.entity';
import { Like } from 'typeorm';

@Injectable()
export class MainSectionService {
  constructor(
    @InjectRepository(MainSectionAssignment)
    private readonly assignRepo: Repository<MainSectionAssignment>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async listFixed(): Promise<MainSectionAssignment[]> {
    // 우선순위 개념 제거: 동일 그룹 순서는 slotKey 접미사 숫자 기준, 그 외엔 baseKey ASC
    return this.assignRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.product', 'product')
      .orderBy("REGEXP_REPLACE(a.slotKey, ' [0-9]+$', '')", 'ASC')
      .addOrderBy("CAST(SUBSTRING_INDEX(a.slotKey, ' ', -1) AS UNSIGNED)", 'ASC')
      .getMany();
  }

  async upsert(dto: UpsertAssignmentDto): Promise<MainSectionAssignment> {
    return await this.assignRepo.manager.transaction(async (trx) => {
      const repo = trx.getRepository(MainSectionAssignment);
      const productRepo = trx.getRepository(Product);

      const product = await productRepo.findOne({ where: { id: dto.productId } });
      if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

      // 우선순위 제거: 저장 시 0으로 통일
      const priority = 0;

      // 같은 그룹(예: "Spring Bright <번호>")의 행들 잠금(경쟁 조건 방지)
      const baseKey = dto.slotKey.replace(/\s+\d+$/, '');
      const likePrefix = `${baseKey} %`;
      await repo
        .createQueryBuilder('a')
        .setLock('pessimistic_write')
        .where('(a.slotKey = :baseKey OR a.slotKey LIKE :likePrefix)', { baseKey, likePrefix })
        .getMany();

      const existing = await repo.findOne({ where: { slotKey: dto.slotKey, productId: dto.productId } });

      if (existing) {
        // 단순 교체
        await repo.update(existing.id, { priority: 0 });
        return await repo.findOneOrFail({ where: { id: existing.id }, relations: ['product'] });
      }

      // 신규 저장(우선순위 없음)
      const saved = await repo.save(repo.create({ slotKey: dto.slotKey, productId: dto.productId, priority: 0 }));
      return await repo.findOneOrFail({ where: { id: saved.id }, relations: ['product'] });
    });
  }

  async replace(dto: ReplaceAssignmentDto): Promise<MainSectionAssignment> {
    return await this.assignRepo.manager.transaction(async (trx) => {
      const repo = trx.getRepository(MainSectionAssignment);
      const productRepo = trx.getRepository(Product);

      const product = await productRepo.findOne({ where: { id: dto.productId } });
      if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

      // 동일 slotKey의 행들을 잠그고 하나만 남기고 교체
      const rows = await repo
        .createQueryBuilder('a')
        .setLock('pessimistic_write')
        .where('a.slotKey = :slotKey', { slotKey: dto.slotKey })
        .orderBy('a.createdAt', 'ASC')
        .getMany();

      if (rows.length === 0) {
        const created = await repo.save(repo.create({ slotKey: dto.slotKey, productId: dto.productId, priority: 0 }));
        return await repo.findOneOrFail({ where: { id: created.id } });
      }

      // 이미 동일 (slotKey, productId) 페어가 존재하면 그 행을 유지 대상으로 선택
      const samePair = rows.find(r => r.productId === dto.productId) ?? null;
      const target = samePair ?? rows[0];
      // 동일 페어가 없을 때만 업데이트 (유니크 제약 충돌 방지)
      if (!samePair && target.productId !== dto.productId) {
        await repo.update({ id: target.id }, { productId: dto.productId });
      }

      // 중복 slotKey 데이터가 존재한다면 정리: 선택된 target 외 모두 제거
      const duplicateIds = rows.filter(r => r.id !== target.id).map(r => r.id);
      if (duplicateIds.length > 0) await repo.delete(duplicateIds);

      return await repo.findOneOrFail({ where: { id: target.id } });
    });
  }

  // 우선순위 제거됨: 밀기 로직 불필요

  async updatePriority(id: string, order: number): Promise<MainSectionAssignment> {
    // 우선순위 기능 제거: 의미 없는 엔드포인트가 되므로 no-op으로 200 반환
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.assignRepo.delete(id);
  }

  async findOne(id: string): Promise<MainSectionAssignment> {
    const item = await this.assignRepo.findOne({ where: { id }, relations: ['product'] });
    if (!item) throw new NotFoundException('지정을 찾을 수 없습니다.');
    return item;
  }

  async searchProducts(q: string | undefined, page = 1, limit = 20, category?: string) {
    const qb = this.productRepo.createQueryBuilder('product');
    qb.leftJoinAndSelect('product.brandEntity', 'brand');
    qb.where('product.isDeleted = FALSE');
    // UI-038: 대소문자 구분 없이 검색
    if (q) {
      const normalizedQ = q.toLowerCase();
      qb.andWhere('(LOWER(product.name) LIKE :q OR LOWER(product.brand) LIKE :q)', { q: `%${normalizedQ}%` });
    }
    // 카테고리 필터: 퍼스널 컬러/체형 매칭 (recommendedColorSeason는 simple-array)
    if (category) {
      qb.andWhere('(product.recommendedColorSeason LIKE :catLike OR product.recommendedBodyType = :category)', {
        catLike: `%${category}%`,
        category,
      });
    }
    const [items, total] = await qb
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }
}


