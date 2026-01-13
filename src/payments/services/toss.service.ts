import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';

@Injectable()
export class TossService {
  private readonly tossClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    const secretKey =
      this.configService.get<string>('TOSS_PAYMENTS_SECRET_KEY') || '';
    const authHeader =
      'Basic ' + Buffer.from(secretKey + ':').toString('base64');

    this.tossClient = axios.create({
      baseURL: 'https://api.tosspayments.com/v1',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });
  }

  async verifyPayment(verifyPaymentDto: VerifyPaymentDto): Promise<{
    status: string;
    virtualAccount: { bank: string; accountNumber: string };
  }> {
    const { paymentKey, orderId, amount } = verifyPaymentDto;

    const res = await this.tossClient.post('/payments/confirm', {
      orderId,
      amount,
      paymentKey,
    });

    return res.data;
  }

  async cancelPayment(
    paymentKey: string,
    reason: string = '사용자 요청에 의한 취소',
  ) {
    const res = await this.tossClient.post(`/payments/${paymentKey}/cancel`, {
      cancelReason: reason,
    });

    return res.data;
  }
}
