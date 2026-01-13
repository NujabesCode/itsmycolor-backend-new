import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColorAnalysis } from './entities/color-analysis.entity';
import { CreateColorAnalysisDto } from './dto/create-color-analysis.dto';
import { UpdateColorAnalysisDto } from './dto/update-color-analysis.dto';
import { PaginationDto, PaginatedResponseDto } from './dto/pagination.dto';

@Injectable()
export class ColorAnalysisService {
  constructor(
    @InjectRepository(ColorAnalysis)
    private colorAnalysisRepository: Repository<ColorAnalysis>,
  ) {}

  async create(createColorAnalysisDto: CreateColorAnalysisDto): Promise<ColorAnalysis> {
    console.log('createColorAnalysisDto', createColorAnalysisDto);
    const colorAnalysis = this.colorAnalysisRepository.create(createColorAnalysisDto);
    return this.colorAnalysisRepository.save(colorAnalysis);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<ColorAnalysis>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      this.colorAnalysisRepository.find({
        relations: ['user'],
        skip,
        take: limit,
      }),
      this.colorAnalysisRepository.count(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<ColorAnalysis> {
    const colorAnalysis = await this.colorAnalysisRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!colorAnalysis) {
      throw new NotFoundException('컬러 분석 결과를 찾을 수 없습니다.');
    }

    return colorAnalysis;
  }

  async findByUserId(userId: string): Promise<ColorAnalysis[]> {
    return this.colorAnalysisRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateColorAnalysisDto: UpdateColorAnalysisDto): Promise<ColorAnalysis> {
    const colorAnalysis = await this.findOne(id);
    
    Object.assign(colorAnalysis, updateColorAnalysisDto);
    return this.colorAnalysisRepository.save(colorAnalysis);
  }

  async remove(id: string): Promise<void> {
    const colorAnalysis = await this.findOne(id);
    await this.colorAnalysisRepository.remove(colorAnalysis);
  }
} 