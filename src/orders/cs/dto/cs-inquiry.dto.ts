import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { InquiryStatus, InquiryType } from '../entities/cs-inquiry.entity';

export class CreateCSInquiryDto {
  @ApiProperty({ description: '문의 유형', enum: InquiryType })
  @IsEnum(InquiryType)
  type: InquiryType;

  @ApiProperty({ description: '문의 제목' })
  @IsString()
  title: string;

  @ApiProperty({ description: '문의 내용' })
  @IsString()
  content: string;

  @ApiProperty({ description: '주문 ID', required: false })
  @IsUUID()
  @IsOptional()
  orderId?: string;
}

export class UpdateCSInquiryDto {
  @ApiProperty({ description: '문의 상태', enum: InquiryStatus })
  @IsEnum(InquiryStatus)
  @IsOptional()
  status?: InquiryStatus;

  @ApiProperty({ description: '답변 내용' })
  @IsString()
  @IsOptional()
  answer?: string;
}

export class CSInquiryResponseDto {
  @ApiProperty({ description: '문의 ID' })
  id: string;

  @ApiProperty({ description: '문의 번호' })
  inquiryNumber: string;

  @ApiProperty({ description: '문의 유형', enum: InquiryType })
  type: InquiryType;

  @ApiProperty({ description: '문의 제목' })
  title: string;

  @ApiProperty({ description: '문의 내용' })
  content: string;

  @ApiProperty({ description: '문의 상태', enum: InquiryStatus })
  status: InquiryStatus;

  @ApiProperty({ description: '답변 내용', required: false })
  answer?: string;

  @ApiProperty({ description: '답변 일시', required: false })
  answeredAt?: Date;

  @ApiProperty({ description: '사용자 정보', required: false })
  user?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ description: '주문 정보', required: false })
  order?: {
    id: string;
  };

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  constructor(partial: Partial<CSInquiryResponseDto>) {
    Object.assign(this, partial);
  }
}
