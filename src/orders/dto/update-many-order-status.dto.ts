import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { OrderStatus } from "../entities/order.entity";

export class UpdateManyOrderStatusDto {
  @ApiProperty({ description: '주문 ID 배열' })
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  orderIds: string[];

  @ApiProperty({ description: '주문 상태' })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;

  @ApiProperty({ description: '배송 택배사', required: false })
  @IsString()
  @IsOptional()
  deliveryCompany?: string;

  @ApiProperty({ description: '배송 송장번호', required: false })
  @IsString()
  @IsOptional()
  deliveryTrackingNumber?: string;
}