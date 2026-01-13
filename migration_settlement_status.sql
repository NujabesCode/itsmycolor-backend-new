-- Settlement 테이블의 status enum 업데이트
-- 기존: '정산대기', '정산완료'
-- 변경: '정산대기', '지급 예정', '지급 완료'

-- 0. 데이터베이스 선택 (먼저 실행!)
USE itsmycolor;

-- 1. 기존 데이터 확인
SELECT DISTINCT status FROM settlement;

-- 2. 기존 enum을 VARCHAR로 임시 변경 (데이터 보존) - 먼저 실행!
ALTER TABLE settlement MODIFY COLUMN status VARCHAR(20);

-- 3. 기존 '정산완료' 값을 '지급 완료'로 변경 (있는 경우)
UPDATE settlement SET status = '지급 완료' WHERE status = '정산완료';

-- 4. 모든 데이터가 새로운 enum 값과 일치하는지 확인 및 업데이트
UPDATE settlement SET status = '정산대기' WHERE status NOT IN ('정산대기', '지급 예정', '지급 완료');

-- 5. enum 타입으로 다시 변경
ALTER TABLE settlement MODIFY COLUMN status ENUM('정산대기', '지급 예정', '지급 완료') DEFAULT '정산대기';

