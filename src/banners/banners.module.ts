import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banner } from './entities/banner.entity';
import { BannersService } from './banners.service';
import { BannersAdminController } from './controllers/banners-admin.controller';
import { BannersPublicController } from './controllers/banners-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Banner])],
  controllers: [BannersAdminController, BannersPublicController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}


