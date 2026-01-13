USE itsmycolor;

-- 기존 컬럼 타입 확인 후 수정
-- 만약 VARCHAR나 다른 타입이라면 ENUM으로 변경

-- 1단계: 기존 컬럼 삭제 (데이터 손실 주의!)
-- ALTER TABLE `product` DROP COLUMN `clothingCategory`;

-- 2단계: ENUM 타입으로 다시 추가
-- ALTER TABLE `product` 
-- ADD COLUMN `clothingCategory` ENUM(
--   '원피스',
--   '블라우스',
--   '아우터',
--   '니트',
--   '티셔츠',
--   '반팔',
--   '스커트',
--   '팬츠',
--   '셔츠',
--   '가디건',
--   '후드',
--   '맨투맨',
--   '청바지',
--   '반바지'
-- ) NULL AFTER `majorCategory`;

-- 또는 기존 컬럼이 VARCHAR라면 ENUM으로 변경
-- ALTER TABLE `product` 
-- MODIFY COLUMN `clothingCategory` ENUM(
--   '원피스',
--   '블라우스',
--   '아우터',
--   '니트',
--   '티셔츠',
--   '반팔',
--   '스커트',
--   '팬츠',
--   '셔츠',
--   '가디건',
--   '후드',
--   '맨투맨',
--   '청바지',
--   '반바지'
-- ) NULL;










