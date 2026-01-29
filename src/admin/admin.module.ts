import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { ColorAnalysis } from '../color-analysis/entities/color-analysis.entity';
import { ConsultingAppointment } from '../color-analysis/entities/consulting-appointment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Order,
      Product,
      ColorAnalysis,
      ConsultingAppointment,
      Payment
    ]),
    UsersModule
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {} 