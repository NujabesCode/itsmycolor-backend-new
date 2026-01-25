// Node.js 18+에서는 crypto가 내장되어 있으므로 별도 설정 불필요
// Node.js 20+에서는 global.crypto가 읽기 전용이므로 설정하지 않음

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ADM-010: IP 주소 추출을 위한 trust proxy 설정
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  
  // CORS 설정
  app.enableCors({
    origin: true, // 실제 배포 시에는 특정 도메인으로 제한하는 것이 좋음
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // 요청 바디 크기 제한 설정 (파일 업로드를 위해)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  // 전역 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          const constraints = error.constraints;
          if (constraints) {
            return Object.values(constraints).join(', ');
          }
          return `${error.property} validation failed`;
        });
        const errorMessage = messages.join('; ');
        console.error('[ValidationPipe] Validation errors:', errorMessage);
        console.error('[ValidationPipe] Error details:', JSON.stringify(errors, null, 2));
        return new BadRequestException(errorMessage);
      },
    }),
  );
  
  // 정적 파일 서빙 설정
  app.use('/payment-test', express.static(join(__dirname, 'payments/public')));
  // 업로드된 파일 서빙 (로컬 저장 시)
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('잇츠마이컬러 API')
    .setDescription('잇츠마이컬러 백엔드 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
  console.log(`Application is accessible at: http://13.125.130.10:${port}`);
}
bootstrap();
