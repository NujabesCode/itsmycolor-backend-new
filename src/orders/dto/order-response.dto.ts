import { ApiProperty } from '@nestjs/swagger';
import { Order, OrderStatus } from '../entities/order.entity';

export class OrderItemDto {
  @ApiProperty({ description: '주문 상품 ID' })
  id: string;

  @ApiProperty({ description: '상품명' })
  productName: string;

  @ApiProperty({ description: '상품 이미지 URL' })
  productImageUrl: string;

  @ApiProperty({ description: '수량' })
  quantity: number;

  @ApiProperty({ description: '가격' })
  price: number;
}

export class OrderResponseDto {
  @ApiProperty({ description: '주문 ID' })
  id: string;

  @ApiProperty({ description: '주문 상태', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: '화폐 단위' })
  currency: string;

  @ApiProperty({ description: '상품 총액' })
  productAmount: number;

  @ApiProperty({ description: '할인 금액' })
  discountAmount: number;

  @ApiProperty({ description: '배송비' })
  shippingFee: number;

  @ApiProperty({ description: '총 결제 금액' })
  totalAmount: number;

  @ApiProperty({ description: '주문 날짜' })
  createdAt: Date;

  @ApiProperty({ description: '배송 택배사', required: false })
  deliveryCompany?: string;

  @ApiProperty({ description: '배송 송장번호', required: false })
  deliveryTrackingNumber?: string;

  @ApiProperty({ description: '받는 사람' })
  recipientName: string;

  @ApiProperty({ description: '받는 사람 연락처' })
  recipientPhone: string;

  @ApiProperty({ description: '우편번호' })
  zipCode: string;

  @ApiProperty({ description: '배송지 주소' })
  shippingAddress: string;

  @ApiProperty({ description: '상세 주소' })
  detailAddress: string;

  @ApiProperty({ description: '배송 요청사항', required: false })
  customDeliveryRequest?: string;

  @ApiProperty({ description: '주문 상품 미리보기', type: [OrderItemDto] })
  orderItems: OrderItemDto[];

  constructor(order: Order) {
    this.id = order.id;
    this.status = order.status;
    this.currency = order.currency;
    this.productAmount = order.productAmount;
    this.discountAmount = order.discountAmount;
    this.shippingFee = order.shippingFee;
    this.totalAmount = order.totalAmount;
    this.createdAt = order.createdAt;
    this.deliveryCompany = order.deliveryCompany;
    this.deliveryTrackingNumber = order.deliveryTrackingNumber;
    this.recipientName = order.recipientName;
    this.recipientPhone = order.recipientPhone;
    this.zipCode = order.zipCode;
    this.shippingAddress = order.shippingAddress;
    this.detailAddress = order.detailAddress;
    this.customDeliveryRequest = order.customDeliveryRequest;

    if (order.orderItems && order.orderItems.length > 0) {
      this.orderItems = order.orderItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        size: item.size,
        isReviewed: item.isReviewed,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        quantity: item.quantity,
        price: item.price,
      }));
    } else {
      this.orderItems = [];
    }
  }
}
