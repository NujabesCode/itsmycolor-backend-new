import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ description: '이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: '전화번호' })
  @IsString()
  phone: string;

  @ApiProperty({ description: '우편번호' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: '주소' })
  @IsString()
  address: string;

  @ApiProperty({ description: '상세 주소' })
  @IsString()
  detailAddress: string;

  @ApiProperty({ description: '배송 요청 사항', required: false })
  @IsString()
  @IsOptional()
  deliveryRequest?: string;
} 