import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';
import { BrandLike } from './entities/brand-like.entity';
import { FilesModule } from '../files/files.module';
import { UsersModule } from '../users/users.module';
import { BrandConnectToken } from './entities/brand-connect-token.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, BrandLike, BrandConnectToken]),
    FilesModule,
    UsersModule,
    NotificationsModule, // SM-013, SM-014, SM-015: 알림 발송을 위해 추가
  ],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {} 