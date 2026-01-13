import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalysisFilterDto {
  @ApiProperty({ 
    description: '시작 날짜 (YYYY-MM-DD)', 
    required: false,
    example: '2024-01-01'
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ 
    description: '종료 날짜 (YYYY-MM-DD)', 
    required: false,
    example: '2024-12-31'
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}










