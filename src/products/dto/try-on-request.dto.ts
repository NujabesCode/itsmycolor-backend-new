import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class TryOnRequestDto {
  @ApiProperty({ description: '제품 ID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: '카테고리 (tops, bottoms, outerwear, dresses 등)', example: 'tops' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ 
    description: '사용자 얼굴 이미지', 
    type: 'string', 
    format: 'binary',
    required: true 
  })
  userImage?: any; // Express.Multer.File 타입은 DTO 직렬화/역직렬화 과정에서 사용되지 않으므로 any로 선언
} 