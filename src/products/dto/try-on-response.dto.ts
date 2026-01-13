import { ApiProperty } from '@nestjs/swagger';

export class TryOnResponseDto {
  @ApiProperty({ description: '시착한 이미지 URL' })
  resultImageUrl: string;

  @ApiProperty({ description: '시착 처리 ID (추후 참조용)' })
  tryOnId: string;
} 