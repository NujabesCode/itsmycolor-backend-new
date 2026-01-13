# Settlement 테이블 마이그레이션 가이드

## 문제
`settlement` 테이블의 `status` 컬럼 enum 값이 변경되어 기존 데이터와 충돌이 발생합니다.

## 해결 방법

### 1. MySQL에 접속하여 다음 SQL 실행

```sql
-- 1. 기존 데이터 확인
SELECT DISTINCT status FROM settlement;

-- 2. 기존 '정산완료' 값을 '지급 완료'로 변경 (있는 경우)
UPDATE settlement SET status = '지급 완료' WHERE status = '정산완료';

-- 3. 기존 enum을 VARCHAR로 임시 변경 (데이터 보존)
ALTER TABLE settlement MODIFY COLUMN status VARCHAR(20);

-- 4. 모든 데이터가 새로운 enum 값과 일치하는지 확인 및 업데이트
UPDATE settlement SET status = '정산대기' WHERE status NOT IN ('정산대기', '지급 예정', '지급 완료');

-- 5. enum 타입으로 다시 변경
ALTER TABLE settlement MODIFY COLUMN status ENUM('정산대기', '지급 예정', '지급 완료') DEFAULT '정산대기';
```

### 2. 마이그레이션 완료 후

`itsmycolor-backend/src/app.module.ts` 파일의 53번째 줄을 다시 원래대로 변경:

```typescript
synchronize: configService.get<boolean>('DB_SYNC', false),
```

### 3. 백엔드 서버 재시작

마이그레이션 완료 후 백엔드 서버를 재시작하면 정상적으로 작동합니다.










