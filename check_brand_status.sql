-- brand 테이블의 status 컬럼 값 확인 및 수정
USE itsmycolor;

-- 1. 현재 status 컬럼 타입 및 값 확인
SELECT DISTINCT status, COUNT(*) as count 
FROM brand 
GROUP BY status;

-- 2. status 컬럼이 enum이 아닌 경우, 타입 확인
SHOW COLUMNS FROM brand WHERE Field = 'status';

-- 3. 만약 잘못된 값이 있다면, enum 값으로 수정
-- 예: 'PENDING' -> '심사중', 'APPROVED' -> '승인됨', 'REJECTED' -> '거부됨'
-- UPDATE brand SET status = '심사중' WHERE status = 'PENDING';
-- UPDATE brand SET status = '승인됨' WHERE status = 'APPROVED';
-- UPDATE brand SET status = '거부됨' WHERE status = 'REJECTED';
