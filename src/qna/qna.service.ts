import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Qna, QnaStatus, QnaType } from './entities/qna.entity';
import { CreateQnaDto } from './dto/create-qna.dto';
import { UpdateQnaDto } from './dto/update-qna.dto';
import { AnswerQnaDto } from './dto/answer-qna.dto';
import { FilesService } from '../files/files.service';
import { QnaResponseDto } from './dto/qna-response.dto';
import { PaginationDto, PaginatedResponseDto } from './dto/pagination.dto';

@Injectable()
export class QnaService {
  constructor(
    @InjectRepository(Qna)
    private qnaRepository: Repository<Qna>,
    private filesService: FilesService,
  ) {}

  async create(
    createQnaDto: CreateQnaDto,
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<QnaResponseDto> {
    let imageUrls: string[] = [];

    if (files && files.length > 0) {
      imageUrls = await Promise.all(
        files.map((file) => this.filesService.uploadFile(file, 'qna')),
      );
    }

    const qna = this.qnaRepository.create({
      ...createQnaDto,
      userId,
      imageUrls: imageUrls.length > 0 ? imageUrls : [],
    });

    const savedQna = await this.qnaRepository.save(qna);
    return this.toResponseDto(savedQna);
  }

  async findAll(options: {
    productId?: string;
    type?: string;
    paginationDto?: PaginationDto;
  }): Promise<PaginatedResponseDto<QnaResponseDto>> {
    const { productId, type, paginationDto } = options;
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.qnaRepository
      .createQueryBuilder('qna')
      .leftJoinAndSelect('qna.user', 'user')
      .select(['qna', 'user.id', 'user.name']);

    if (productId) {
      queryBuilder.andWhere('qna.productId = :productId', { productId });
    }

    if (type) {
      queryBuilder.andWhere('qna.type = :type', { type });
    }

    queryBuilder.orderBy('qna.createdAt', 'DESC');

    const [qnas, totalItems] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: qnas.map((qna) => this.toResponseDto(qna)),
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findAllForAdmin(options: {
    type?: string;
    paginationDto?: PaginationDto;
  }): Promise<PaginatedResponseDto<QnaResponseDto>> {
    const { type, paginationDto } = options;
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.qnaRepository
      .createQueryBuilder('qna')
      .leftJoinAndSelect('qna.user', 'user')
      .select(['qna', 'user.id', 'user.name'])
      .where('qna.type IN (:...types)', {
        types: [QnaType.BODY, QnaType.COLOR],
      });

    if (type) {
      queryBuilder.andWhere('qna.type = :type', { type });
    }

    queryBuilder.orderBy('qna.createdAt', 'DESC');

    const [qnas, totalItems] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: qnas.map((qna) => this.toResponseDto(qna)),
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findByUserId(
    userId: string,
    paginationDto: PaginationDto,
    options: { status?: string; type?: string; search?: string },
  ): Promise<PaginatedResponseDto<QnaResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const { status, type, search } = options;

    const queryBuilder = this.qnaRepository
      .createQueryBuilder('qna')
      .where('qna.userId = :userId', { userId })
      .leftJoinAndSelect('qna.product', 'product')
      .select(['qna', 'product.id', 'product.name', 'product.imageUrl']);

    if (status) {
      queryBuilder.andWhere('qna.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('qna.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(qna.title LIKE :search OR qna.content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('qna.createdAt', 'DESC');

    const [qnas, totalItems] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: qnas.map((qna) => this.toResponseDto(qna)),
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findByBrandId(brandId: string) {
    const qnas = await this.qnaRepository
      .createQueryBuilder('qna')
      .leftJoinAndSelect('qna.product', 'product')
      .leftJoinAndSelect('qna.user', 'user')
      .where('product.brandId = :brandId', { brandId })
      .andWhere('qna.type NOT IN (:...types)', {
        types: [QnaType.BODY, QnaType.COLOR],
      })
      .getMany();

    return qnas.map((qna) => this.toResponseDto(qna));
  }

  async findOne(id: string): Promise<Qna> {
    const qna = await this.qnaRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!qna) {
      throw new NotFoundException(`QnA ID ${id}를 찾을 수 없습니다.`);
    }

    return qna;
  }

  async update(
    id: string,
    updateQnaDto: UpdateQnaDto,
    files?: Express.Multer.File[],
  ): Promise<Qna> {
    const qna = await this.findOne(id);

    if (qna.status === QnaStatus.ANSWERED) {
      throw new ForbiddenException(
        '이미 답변이 작성된 문의는 수정할 수 없습니다.',
      );
    }

    let imageUrls = qna.imageUrls || [];

    if (files && files.length > 0) {
      const newImageUrls = await Promise.all(
        files.map((file) => this.filesService.uploadFile(file, 'qna')),
      );
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    if (
      updateQnaDto.removeImageUrls &&
      updateQnaDto.removeImageUrls.length > 0
    ) {
      const removeUrls = updateQnaDto.removeImageUrls;
      imageUrls = imageUrls.filter((url) => !removeUrls.includes(url));

      // 실제 S3에서 파일 제거 로직은 생략 (필요시 구현)
    }

    Object.assign(qna, {
      ...updateQnaDto,
      imageUrls: imageUrls.length > 0 ? imageUrls : null,
    });

    return this.qnaRepository.save(qna);
  }

  async remove(id: string): Promise<void> {
    const qna = await this.findOne(id);
    await this.qnaRepository.remove(qna);
  }

  async answer(
    id: string,
    answerQnaDto: AnswerQnaDto,
    adminId: string,
  ): Promise<Qna> {
    const qna = await this.findOne(id);

    qna.answer = answerQnaDto.answer;
    qna.status = QnaStatus.ANSWERED;
    qna.answeredAt = new Date();
    qna.answeredBy = adminId;

    return this.qnaRepository.save(qna);
  }

  private toResponseDto(qna: Qna): QnaResponseDto {
    return {
      id: qna.id,
      title: qna.title,
      content: qna.content,
      type: qna.type,
      status: qna.status,
      isPrivate: qna.isPrivate,
      answer: qna.answer,
      answeredAt: qna.answeredAt,
      answeredBy: qna.answeredBy,
      imageUrls: qna.imageUrls || [],
      user: qna.user
        ? {
            id: qna.user.id,
            name: qna.user.name,
          }
        : { id: '', name: '' },
      product: qna.product
        ? {
            id: qna.product.id,
            name: qna.product.name,
            imageUrl: qna.product.imageUrl || '',
          }
        : undefined,
      createdAt: qna.createdAt,
      updatedAt: qna.updatedAt,
    };
  }
}
