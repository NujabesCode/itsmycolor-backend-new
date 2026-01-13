import { ApiProperty } from '@nestjs/swagger';
import { Order, OrderStatus } from '../entities/order.entity';

export class OrderItemDetailDto {
  @ApiProperty({ description: '주문 상품 ID' })
  id: string;

  @ApiProperty({ description: '상품 ID' })
  productId: string;

  @ApiProperty({ description: '상품명' })
  productName: string;

  @ApiProperty({ description: '상품 이미지 URL' })
  productImageUrl: string;

  @ApiProperty({ description: '수량' })
  quantity: number;

  @ApiProperty({ description: '가격' })
  price: number;

  @ApiProperty({ description: '선택 사이즈' })
  size: string;

  @ApiProperty({ description: '선택 색상' })
  color: string;

  @ApiProperty({ description: '리뷰 작성 여부' })
  isReviewed: boolean;
}

export class OrderUserDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '사용자 이름' })
  name: string;

  @ApiProperty({ description: '사용자 이메일' })
  email: string;
}

export class OrderDetailResponseDto {
  @ApiProperty({ description: '주문 ID' })
  id: string;

  @ApiProperty({ description: '주문 상태', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: '통화', default: 'KRW' })
  currency: string;

  @ApiProperty({ description: '상품 총액' })
  productAmount: number;

  @ApiProperty({ description: '할인 금액' })
  discountAmount: number;

  @ApiProperty({ description: '배송비' })
  shippingFee: number;

  @ApiProperty({ description: '총 결제 금액' })
  totalAmount: number;

  @ApiProperty({ description: '우편번호' })
  zipCode: string;

  @ApiProperty({ description: '배송지 주소' })
  shippingAddress: string;

  @ApiProperty({ description: '상세 주소' })
  detailAddress: string;

  @ApiProperty({ description: '받는 사람' })
  recipientName: string;

  @ApiProperty({ description: '받는 사람 연락처' })
  recipientPhone: string;

  @ApiProperty({ description: '직접 입력 배송 요청사항' })
  customDeliveryRequest: string;

  @ApiProperty({ description: '개인정보 수집 및 이용 동의' })
  privacyAgreement: boolean;

  @ApiProperty({ description: '구매조건 확인 및 결제 진행 동의' })
  purchaseAgreement: boolean;

  @ApiProperty({ description: '주문 상품 상세', type: [OrderItemDetailDto] })
  orderItems: OrderItemDetailDto[];

  @ApiProperty({ description: '주문자 정보', type: OrderUserDto })
  user: OrderUserDto;

  @ApiProperty({ description: '주문 날짜' })
  createdAt: Date;

  @ApiProperty({ description: '주문 수정 날짜' })
  updatedAt: Date;

  constructor(order: Order) {
    this.id = order.id;
    this.status = order.status;
    this.currency = order.currency;
    this.productAmount = order.productAmount;
    this.discountAmount = order.discountAmount;
    this.shippingFee = order.shippingFee;
    this.totalAmount = order.totalAmount;
    this.zipCode = order.zipCode;
    this.shippingAddress = order.shippingAddress;
    this.detailAddress = order.detailAddress;
    this.recipientName = order.recipientName;
    this.recipientPhone = order.recipientPhone;
    this.customDeliveryRequest = order.customDeliveryRequest;
    this.privacyAgreement = order.privacyAgreement;
    this.purchaseAgreement = order.purchaseAgreement;
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;

    if (order.orderItems && order.orderItems.length > 0) {
      this.orderItems = order.orderItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        isReviewed: item.isReviewed,
      }));
    } else {
      this.orderItems = [];
    }

    if (order.user) {
      this.user = {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      };
    }
  }
}
