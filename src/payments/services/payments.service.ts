import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { TossService } from './toss.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { Repository } from 'typeorm';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import { OrdersService } from 'src/orders/orders.service';
import { OrderStatus } from 'src/orders/entities/order.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private readonly tossService: TossService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPaymentByOrderId(orderId: string) {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .where('payment.orderId = :orderId', { orderId })
      .getOne();
  }

  async getPaymentByPaymentKey(paymentKey: string) {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .where('payment.paymentKey = :paymentKey', { paymentKey })
      .getOne();
  }

  async createPaymentByCard(
    paymentKey: string,
    orderId: string,
    amount: number,
  ) {
    const payment = this.paymentRepository.create({
      paymentKey,
      orderId,
      isPaid: true,
      paidAmount: amount,
    });
    return await this.paymentRepository.save(payment);
  }

  async createPaymentByVirtualAccount(
    paymentKey: string,
    virtualAccount: string,
    orderId: string,
  ) {
    const payment = this.paymentRepository.create({
      paymentKey,
      virtualAccount,
      orderId,
      isPaid: false,
      paidAmount: 0,
    });
    return await this.paymentRepository.save(payment);
  }

  async verifyPayment(verifyPaymentDto: VerifyPaymentDto) {
    const { paymentKey, orderId, amount } = verifyPaymentDto;

    // 이미 결제한 경우, 결제 정보 반환
    const prevPayment = await this.getPaymentByPaymentKey(paymentKey);
    if (prevPayment) {
      return prevPayment;
    }

    // 토스에서 결제 처리
    const res = await this.tossService.verifyPayment({
      paymentKey,
      orderId,
      amount,
    });
    const { status, virtualAccount } = res;

    if (status === 'WAITING_FOR_DEPOSIT') {
      // 입금 대기(가상계좌 입금)
      await this.createPaymentByVirtualAccount(
        paymentKey,
        JSON.stringify(virtualAccount),
        orderId,
      );
    } else {
      // 입금 완료
      await this.ordersService.updateOnlyStatus(orderId, OrderStatus.CONFIRMED);
      await this.createPaymentByCard(paymentKey, orderId, amount);
    }

    try {
      const order = await this.ordersService.findOne(orderId);
      const orders = await this.ordersService.findByUserId(order.userId, {});

      if (orders.orders.length === 1) {
        await this.notificationsService.createFirstOrderNotification(order.userId, '퍼스널 컬러 진단 쿠폰');
        await this.notificationsService.createFirstOrderNotification(order.userId, '골격 진단 쿠폰');
      }
    } catch {}

    return await this.getPaymentByPaymentKey(paymentKey);
  }

  async cancelPayment(orderId: string, reason?: string) {
    const payment = await this.getPaymentByOrderId(orderId);
    if (!payment) {
      throw new NotFoundException('결제 정보를 찾을 수 없습니다.');
    }
    if (!payment.isPaid) {
      throw new BadRequestException('결제되지 않은 주문입니다.');
    }
    if (payment.isCanceled) {
      throw new BadRequestException('이미 취소된 주문입니다.');
    }

    await this.tossService.cancelPayment(payment.paymentKey, reason);

    payment.isCanceled = true;
    payment.cancelAmount = payment.paidAmount;
    await this.paymentRepository.save(payment);
  }

  async cancelForWebhook(orderId: string, cancelAmount: number) {
    const payment = await this.getPaymentByOrderId(orderId);
    if (!payment) {
      throw new NotFoundException('결제 정보를 찾을 수 없습니다.');
    }
    if (!payment.isPaid) {
      throw new BadRequestException('결제되지 않은 주문입니다.');
    }
    if (payment.isCanceled) {
      throw new BadRequestException('이미 취소된 주문입니다.');
    }

    payment.isCanceled = true;
    payment.cancelAmount = payment.cancelAmount + cancelAmount;
    await this.paymentRepository.save(payment);

    await this.ordersService.updateOnlyStatus(orderId, OrderStatus.CANCELLED);
  }

  async depositForWebhook(orderId: string) {
    const order = await this.ordersService.findOne(orderId);
    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    const payment = await this.getPaymentByOrderId(orderId);
    if (!payment) {
      throw new NotFoundException('결제 정보를 찾을 수 없습니다.');
    }

    if (payment.isPaid) {
      throw new BadRequestException('이미 결제된 주문입니다.');
    }

    payment.isPaid = true;
    payment.paidAmount = order.totalAmount;
    await this.paymentRepository.save(payment);

    await this.ordersService.updateOnlyStatus(orderId, OrderStatus.CONFIRMED);
  }
}
