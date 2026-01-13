import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { ProductLike } from './entities/product-like.entity';
import { FilesModule } from '../files/files.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductLike]),
    FilesModule,
    BrandsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, TypeOrmModule.forFeature([Product, ProductLike])],
})
export class ProductsModule {} 