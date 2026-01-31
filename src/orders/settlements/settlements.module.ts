import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { TaxInvoicesController } from './tax-invoices.controller';
import { TaxInvoicesService } from './tax-invoices.service';
import { Settlement } from './entities/settlement.entity';
import { Commission } from './entities/commission.entity';
import { TaxInvoice } from './entities/tax-invoice.entity';
import { TaxDocument } from './entities/tax-document.entity';
import { Order } from '../entities/order.entity';
import { OrdersModule } from '../orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement, Commission, TaxInvoice, TaxDocument, Order]),
    OrdersModule,
  ],
  controllers: [SettlementsController, TaxInvoicesController],
  providers: [SettlementsService, TaxInvoicesService],
  exports: [SettlementsService, TaxInvoicesService],
})
export class SettlementsModule {} 