import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CSManagementController } from './cs-management.controller';
import { CSManagementService } from './cs-management.service';
import { CSInquiry } from './entities/cs-inquiry.entity';
import { OrdersModule } from '../orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CSInquiry]),
    OrdersModule,
  ],
  controllers: [CSManagementController],
  providers: [CSManagementService],
  exports: [CSManagementService],
})
export class CSManagementModule {} 