import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ description: '삭제할 기존 이미지들', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeImageUrls?: string[];
} 