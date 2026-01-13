import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { TossService } from './services/toss.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { OrdersModule } from 'src/orders/orders.module';
import { PaymentsService } from './services/payments.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([Payment]),
    forwardRef(() => OrdersModule),
    NotificationsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, TossService],
  exports: [PaymentsService, TossService],
})
export class PaymentsModule {}
