import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { BannerVisibility } from '../entities/banner.entity';

export class CreateBannerDto {
  @ApiProperty({ description: '배너 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: '배너 서브 타이틀' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty({ enum: BannerVisibility, description: '공개 여부' })
  @IsEnum(BannerVisibility)
  visibility: BannerVisibility;

  @ApiPropertyOptional({ description: '우선순위(1~5). 비공개 시 필수 아님' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ description: 'PC 이미지 URL' })
  @IsOptional()
  @IsUrl()
  imagePcUrl?: string;

  @ApiPropertyOptional({ description: '모바일 이미지 URL' })
  @IsOptional()
  @IsUrl()
  imageMobileUrl?: string;

  @ApiPropertyOptional({ description: '링크 URL' })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;
}

export class UpdateBannerDto {
  @ApiPropertyOptional({ description: '배너 제목' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '배너 서브 타이틀' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ enum: BannerVisibility, description: '공개 여부' })
  @IsEnum(BannerVisibility)
  @IsOptional()
  visibility?: BannerVisibility;

  @ApiPropertyOptional({ description: '우선순위(1~5). 비공개 시 0으로 처리' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ description: 'PC 이미지 URL' })
  @IsOptional()
  @IsUrl()
  imagePcUrl?: string;

  @ApiPropertyOptional({ description: '모바일 이미지 URL' })
  @IsOptional()
  @IsUrl()
  imageMobileUrl?: string;

  @ApiPropertyOptional({ description: '링크 URL' })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;
}

export class BannerListQueryDto {
  @ApiPropertyOptional({ description: '페이지(기본 1)' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '페이지 크기(기본 20)' })
  @IsOptional()
  limit?: number;
}


