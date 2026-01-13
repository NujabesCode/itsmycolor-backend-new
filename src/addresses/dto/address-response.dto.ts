import { ApiProperty } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty({ description: '주소 ID' })
  id: string;

  @ApiProperty({ description: '우편번호' })
  postalCode: string;

  @ApiProperty({ description: '주소' })
  address: string;

  @ApiProperty({ description: '상세 주소' })
  detailAddress: string;

  @ApiProperty({ description: '배송 요청 사항', required: false })
  deliveryRequest?: string;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  constructor(partial: Partial<AddressResponseDto>) {
    Object.assign(this, partial);
  }
} 