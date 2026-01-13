const mysql = require('mysql2/promise');

async function fixAllFKIssues() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '0000',
      database: 'itsmycolor',
    });

    console.log('데이터베이스 연결 성공\n');

    // brand.id 타입 확인
    const [brandCols] = await connection.query(`
      SHOW FULL COLUMNS FROM brand WHERE Field = 'id'
    `);
    const brandIdType = brandCols[0].Type;
    const brandIdCollation = brandCols[0].Collation;
    console.log(`brand.id: ${brandIdType} ${brandIdCollation || ''}`);

    // settlement.id 타입 확인
    const [settlementCols] = await connection.query(`
      SHOW FULL COLUMNS FROM settlement WHERE Field = 'id'
    `);
    const settlementIdType = settlementCols[0].Type;
    const settlementIdCollation = settlementCols[0].Collation;
    console.log(`settlement.id: ${settlementIdType} ${settlementIdCollation || ''}\n`);

    // brandId를 사용하는 모든 테이블 찾기
    const tables = ['tax_invoice', 'settlement', 'product', 'tax_document'];
    
    for (const tableName of tables) {
      console.log(`=== ${tableName} 처리 ===`);
      
      // brandId 컬럼 확인
      const [brandIdCols] = await connection.query(`
        SHOW FULL COLUMNS FROM \`${tableName}\` WHERE Field = 'brandId'
      `);
      
      if (brandIdCols.length > 0) {
        const currentType = brandIdCols[0].Type;
        const currentCollation = brandIdCols[0].Collation;
        
        if (currentType !== brandIdType || currentCollation !== brandIdCollation) {
          console.log(`  brandId 타입 변경: ${currentType} -> ${brandIdType}`);
          try {
            await connection.query(`
              ALTER TABLE \`${tableName}\` 
              MODIFY COLUMN brandId ${brandIdType}${brandIdCollation ? ` COLLATE ${brandIdCollation}` : ''}
            `);
            console.log(`  ✅ 변경 완료`);
          } catch (err) {
            console.log(`  ⚠️ 변경 실패: ${err.message}`);
          }
        } else {
          console.log(`  ✅ brandId 타입 일치`);
        }
      }

      // settlementId 컬럼 확인
      const [settlementIdCols] = await connection.query(`
        SHOW FULL COLUMNS FROM \`${tableName}\` WHERE Field = 'settlementId'
      `);
      
      if (settlementIdCols.length > 0) {
        const currentType = settlementIdCols[0].Type;
        const currentCollation = settlementIdCols[0].Collation;
        
        if (currentType !== settlementIdType || currentCollation !== settlementIdCollation) {
          console.log(`  settlementId 타입 변경: ${currentType} -> ${settlementIdType}`);
          try {
            await connection.query(`
              ALTER TABLE \`${tableName}\` 
              MODIFY COLUMN settlementId ${settlementIdType}${settlementIdCollation ? ` COLLATE ${settlementIdCollation}` : ''} NOT NULL
            `);
            console.log(`  ✅ 변경 완료`);
          } catch (err) {
            console.log(`  ⚠️ 변경 실패: ${err.message}`);
          }
        } else {
          console.log(`  ✅ settlementId 타입 일치`);
        }
      }
    }

    console.log('\n✅ 모든 작업 완료!');

  } catch (error) {
    console.error('에러:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixAllFKIssues();
