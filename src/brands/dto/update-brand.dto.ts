import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateBrandDto } from './create-brand.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBrandDto extends PartialType(CreateBrandDto) {
  @ApiProperty({ description: '브랜드 로고 URL', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ description: '브랜드 배경 이미지 URL', required: false })
  @IsString()
  @IsOptional()
  backgroundUrl?: string;
} 