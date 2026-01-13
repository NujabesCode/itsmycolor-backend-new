import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MainSectionAssignment } from './entities/main-section-assignment.entity';
import { MainSectionService } from './main-section.service';
import { MainSectionAdminController } from './main-section.controller';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MainSectionAssignment, Product])],
  controllers: [MainSectionAdminController],
  providers: [MainSectionService],
  exports: [MainSectionService],
})
export class MainSectionModule {}


