import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './services/payments.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('결제')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '결제 확인' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '결제 확인 성공',
  })
  @ApiBody({ type: VerifyPaymentDto })
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
    return await this.paymentsService.verifyPayment(verifyPaymentDto);
  }

  @Post('webhook/toss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toss 웹훅' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Toss 웹훅 성공',
  })
  async tossWebhook(@Body() body: any) {
    const data = body.data;

    const { status, orderId, method, cancels } = data;

    if (status === 'CANCELED' || status === 'PARTIAL_CANCELED') {
      const cancel = cancels[cancels.length - 1];
      const { cancelAmount } = cancel;

      await this.paymentsService.cancelForWebhook(orderId, cancelAmount);
    } else if (status === 'DONE' && method === '가상계좌') {
      await this.paymentsService.depositForWebhook(orderId);
    } else {
      console.log('nothing to do');
    }

    return;
  }
}
