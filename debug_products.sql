USE itsmycolor;

-- 1. 전체 상품 개수 확인
SELECT COUNT(*) as total_products FROM product WHERE isDeleted = FALSE;

-- 2. recommendedColorSeason이 있는 상품 확인
SELECT 
  id, 
  name, 
  brand,
  recommendedColorSeason,
  recommendedBodyType,
  isAvailable,
  imageUrl
FROM product 
WHERE isDeleted = FALSE 
  AND (recommendedColorSeason IS NOT NULL AND recommendedColorSeason != '')
LIMIT 10;

-- 3. recommendedBodyType이 있는 상품 확인
SELECT 
  id, 
  name, 
  brand,
  recommendedColorSeason,
  recommendedBodyType,
  isAvailable,
  imageUrl
FROM product 
WHERE isDeleted = FALSE 
  AND recommendedBodyType IS NOT NULL
LIMIT 10;

-- 4. 필터 없이 모든 상품 확인 (BEST 섹션용)
SELECT 
  id, 
  name, 
  brand,
  price,
  recommendedColorSeason,
  recommendedBodyType,
  isAvailable,
  imageUrl,
  createdAt
FROM product 
WHERE isDeleted = FALSE
ORDER BY createdAt DESC
LIMIT 20;










