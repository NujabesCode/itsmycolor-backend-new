# 잇츠마이컬러 백엔드 API

퍼스널 컬러 진단 및 쇼핑 서비스를 위한 백엔드 API

## 기술 스택

- Nest.js
- TypeORM
- MySQL
- AWS S3
- Swagger
- JWT 인증

## 요구사항

- Node.js 18 이상
- MySQL 8.0 이상
- AWS 계정 (S3 권한)

## 설치

```bash
$ npm install
```

## 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

```
# 서버 설정
PORT=3000
NODE_ENV=development

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=itsmycolor
DB_SYNC=true
DB_LOGGING=true

# JWT 설정
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# AWS S3 설정
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
```

## 실행

```bash
# 개발 모드
$ npm run start:dev

# 프로덕션 모드
$ npm run start:prod
```

## API 문서

서버 실행 후 다음 URL로 Swagger API 문서에 접근할 수 있습니다:

```
http://localhost:3000/api
```

## 주요 기능

- 사용자 인증 (회원가입/로그인)
- 퍼스널 컬러 분석 결과 관리
- 주문 및 배송 관리
- Q&A 문의 관리
- AWS S3 파일 업로드

## 디렉토리 구조

```
src/
├── auth/              # 인증 관련 기능
├── color-analysis/    # 퍼스널 컬러 분석 기능
├── common/            # 공통 코드 (데코레이터, 유틸리티 등)
├── files/             # 파일 업로드 기능
├── orders/            # 주문 관련 기능
├── products/          # 상품 관련 기능
├── qna/               # Q&A 문의 기능
├── users/             # 사용자 관리 기능
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
