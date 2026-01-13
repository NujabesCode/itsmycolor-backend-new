import { ApiProperty } from '@nestjs/swagger';
import { Qna, QnaStatus, QnaType } from '../entities/qna.entity';

export class QnaUserDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '사용자 이름' })
  name: string;
}

export class QnaProductDto {
  @ApiProperty({ description: '상품 ID' })
  id: string;

  @ApiProperty({ description: '상품명' })
  name: string;

  @ApiProperty({ description: '상품 이미지 URL' })
  imageUrl: string;
}

export class QnaResponseDto {
  @ApiProperty({ description: '문의 ID' })
  id: string;

  @ApiProperty({ description: '문의 제목' })
  title: string;

  @ApiProperty({ description: '문의 내용' })
  content: string;

  @ApiProperty({ description: '문의 유형', enum: QnaType })
  type: QnaType;

  @ApiProperty({ description: '문의 상태', enum: QnaStatus })
  status: QnaStatus;

  @ApiProperty({ description: '답변', required: false })
  answer?: string;

  @ApiProperty({ description: '답변일', required: false })
  answeredAt?: Date;

  @ApiProperty({ description: '답변자 ID', required: false })
  answeredBy?: string;

  @ApiProperty({ description: '비밀글 여부' })
  isPrivate: boolean;

  @ApiProperty({ description: '첨부 이미지 URL 목록', type: [String], required: false })
  imageUrls?: string[];

  @ApiProperty({ description: '작성자 정보', type: QnaUserDto })
  user: QnaUserDto;

  @ApiProperty({ description: '상품 정보', type: QnaProductDto, required: false })
  product?: QnaProductDto;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  constructor(qna: Qna) {
    this.id = qna.id;
    this.title = qna.title;
    this.content = qna.content;
    this.type = qna.type;
    this.status = qna.status;
    this.answer = qna.answer;
    this.answeredAt = qna.answeredAt;
    this.answeredBy = qna.answeredBy;
    this.isPrivate = qna.isPrivate;
    this.imageUrls = qna.imageUrls;
    this.createdAt = qna.createdAt;
    this.updatedAt = qna.updatedAt;
    
    if (qna.user) {
      this.user = {
        id: qna.user.id,
        name: qna.user.name,
      };
    }
    
    if (qna.product) {
      this.product = {
        id: qna.product.id,
        name: qna.product.name,
        imageUrl: qna.product.imageUrl,
      };
    }
  }
} 