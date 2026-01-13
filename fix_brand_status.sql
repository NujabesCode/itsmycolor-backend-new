-- brand 테이블의 status 컬럼 값 확인 및 수정
USE itsmycolor;

-- 1. 현재 status 컬럼의 타입과 값 확인
SHOW COLUMNS FROM brand WHERE Field = 'status';

-- 2. 현재 status 값들 확인
SELECT DISTINCT status, COUNT(*) as count 
FROM brand 
GROUP BY status;

-- 3. 잘못된 값이 있는 경우 enum 값으로 수정
-- TypeORM enum 정의: '심사중', '승인됨', '거부됨', '재심사 요청'
-- 영문 값이나 다른 값이 있으면 한글 enum 값으로 변경

-- 예시: 영문 값을 한글 enum 값으로 변경
-- UPDATE brand SET status = '심사중' WHERE status = 'PENDING' OR status = 'pending';
-- UPDATE brand SET status = '승인됨' WHERE status = 'APPROVED' OR status = 'approved';
-- UPDATE brand SET status = '거부됨' WHERE status = 'REJECTED' OR status = 'rejected';

-- 4. status 컬럼이 varchar인 경우 enum으로 변경 (필요시)
-- ALTER TABLE brand MODIFY COLUMN status ENUM('심사중', '승인됨', '거부됨', '재심사 요청') DEFAULT '심사중';
