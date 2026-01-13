import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ description: '상품 ID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: '상품명' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ description: '수량', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '가격' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ description: '선택 사이즈', required: false })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({ description: '선택 색상', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: '상품 이미지 URL', required: false })
  @IsString()
  @IsOptional()
  productImageUrl?: string;
} 