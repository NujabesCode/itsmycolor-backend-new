import { PartialType } from '@nestjs/swagger';
import { CreateQnaDto } from './create-qna.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateQnaDto extends PartialType(CreateQnaDto) {
  @ApiProperty({ description: '삭제할 이미지 URL 목록', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeImageUrls?: string[];
} 