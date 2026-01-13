USE itsmycolor;

-- clothingCategory 컬럼 추가
ALTER TABLE `product` 
ADD COLUMN `clothingCategory` ENUM(
  '원피스',
  '블라우스',
  '아우터',
  '니트',
  '티셔츠',
  '반팔',
  '스커트',
  '팬츠',
  '셔츠',
  '가디건',
  '후드',
  '맨투맨',
  '청바지',
  '반바지'
) NULL AFTER `majorCategory`;










