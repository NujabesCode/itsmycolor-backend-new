import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ColorAnalysisModule } from './color-analysis/color-analysis.module';
import { OrdersModule } from './orders/orders.module';
import { QnaModule } from './qna/qna.module';
import { ProductsModule } from './products/products.module';
import { FilesModule } from './files/files.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SettlementsModule } from './orders/settlements/settlements.module';
import { CSManagementModule } from './orders/cs/cs-management.module';
import { ReturnsModule } from './orders/returns/returns.module';
import { BrandsModule } from './brands/brands.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { EmailModule } from './email/email.module';
import { AddressesModule } from './addresses/addresses.module';
import { CouponsModule } from './coupons/coupons.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BannersModule } from './banners/banners.module';
import { MainSectionModule } from './main-section/main-section.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        FASHN_AI_API_KEY: Joi.string().allow('').optional(),
        PAYPAL_CLIENT_ID: Joi.string().allow('').optional(),
        PAYPAL_CLIENT_SECRET: Joi.string().allow('').optional(),
        TOSS_PAYMENTS_SECRET_KEY: Joi.string().allow('').optional(),
        APP_URL: Joi.string().allow('').optional(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'itsmycolor'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('DB_SYNC', false),
        logging: configService.get<boolean>('DB_LOGGING', false),
      }),
    }),
    UsersModule,
    AuthModule.forRoot(),
    ColorAnalysisModule,
    OrdersModule,
    QnaModule,
    ProductsModule,
    FilesModule,
    ReviewsModule,
    SettlementsModule,
    CSManagementModule,
    ReturnsModule,
    BrandsModule,
    AdminModule,
    PaymentsModule,
    EmailModule,
    AddressesModule,
    CouponsModule,
    NotificationsModule,
    BannersModule,
    MainSectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
