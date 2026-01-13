USE itsmycolor;

-- 삭제되지 않은 모든 상품 확인
SELECT 
  id,
  name,
  brand,
  price,
  isDeleted,
  isAvailable,
  recommendedColorSeason,
  recommendedBodyType,
  imageUrl,
  createdAt
FROM product
WHERE isDeleted = FALSE
ORDER BY createdAt DESC
LIMIT 20;

-- 판매중인 상품 개수 확인
SELECT COUNT(*) as total_available
FROM product
WHERE isDeleted = FALSE;

-- recommendedColorSeason이 있는 상품 개수
SELECT COUNT(*) as with_color_season
FROM product
WHERE isDeleted = FALSE 
  AND recommendedColorSeason IS NOT NULL 
  AND recommendedColorSeason != '';

-- recommendedBodyType이 있는 상품 개수
SELECT COUNT(*) as with_body_type
FROM product
WHERE isDeleted = FALSE 
  AND recommendedBodyType IS NOT NULL;










