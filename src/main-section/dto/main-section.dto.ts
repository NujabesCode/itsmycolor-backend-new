import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BodyType } from '../../common/types/body-type.enum';
import { ColorSeason } from '../../common/types/color-season.enum';

export class UpsertAssignmentDto {
  @ApiProperty({ description: '슬롯 키(컬러시즌 또는 체형)', enum: [...Object.values(ColorSeason), ...Object.values(BodyType)] })
  @IsString()
  slotKey: string;

  @ApiProperty({ description: '상품 ID' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: '우선순위(1~3). 미지정 시 0', minimum: 0, maximum: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  priority?: number;
}

export class ReplaceAssignmentDto {
  @ApiProperty({ description: '슬롯 키(컬러시즌 또는 체형)', enum: [...Object.values(ColorSeason), ...Object.values(BodyType)] })
  @IsString()
  slotKey: string;

  @ApiProperty({ description: '새로 연결할 상품 ID' })
  @IsString()
  productId: string;
}

export class UpdatePriorityDto {
  @ApiProperty({ description: '우선순위(1~3)' })
  @IsInt()
  @Min(1)
  @Max(3)
  priority: number;
}

export class SearchProductsQueryDto {
  @ApiPropertyOptional({ description: '검색어(제품명 또는 브랜드명 OR)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: '페이지', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '페이지 크기', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: '카테고리 필터(예: Spring Light 등)' })
  @IsOptional()
  @IsString()
  category?: string;
}


