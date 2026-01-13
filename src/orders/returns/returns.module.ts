import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { ReturnRequest } from './entities/return-request.entity';
import { OrdersModule } from '../orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReturnRequest]),
    OrdersModule,
  ],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {} 