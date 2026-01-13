import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { Settlement } from './entities/settlement.entity';
import { Commission } from './entities/commission.entity';
import { TaxInvoice } from './entities/tax-invoice.entity';
import { TaxDocument } from './entities/tax-document.entity';
import { OrdersModule } from '../orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement, Commission, TaxInvoice, TaxDocument]),
    OrdersModule,
  ],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {} 