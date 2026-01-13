import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

interface ApiDocOptions {
  summary: string;
  description?: string;
  isAuth?: boolean;
  isCreated?: boolean;
}

export function ApiDoc(options: ApiDocOptions) {
  const { summary, description, isAuth = false, isCreated = false } = options;

  const decorators = [
    ApiOperation({ summary, description }),
    isCreated
      ? ApiCreatedResponse({ description: '성공적으로 처리되었습니다.' })
      : ApiOkResponse({ description: '성공적으로 처리되었습니다.' }),
    ApiBadRequestResponse({
      description: '잘못된 요청입니다.',
    }),
  ];

  if (isAuth) {
    decorators.push(
      ApiBearerAuth(),
      ApiUnauthorizedResponse({
        description: '인증되지 않은 사용자입니다.',
      }),
      ApiForbiddenResponse({
        description: '접근 권한이 없습니다.',
      }),
    );
  }

  decorators.push(
    ApiNotFoundResponse({
      description: '리소스를 찾을 수 없습니다.',
    }),
  );

  return applyDecorators(...decorators);
} 