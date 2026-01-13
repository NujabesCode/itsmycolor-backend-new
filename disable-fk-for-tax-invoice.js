const mysql = require('mysql2/promise');

async function disableFKForTaxInvoice() {
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

    // tax_document 테이블도 확인 (tax_invoice와 유사한 구조일 수 있음)
    const tables = ['tax_invoice', 'tax_document'];
    
    for (const tableName of tables) {
      console.log(`\n=== ${tableName} 테이블 처리 ===`);
      
      // settlementId 컬럼이 있는지 확인
      const [cols] = await connection.query(`
        SHOW COLUMNS FROM \`${tableName}\` WHERE Field = 'settlementId'
      `);
      
      if (cols.length === 0) {
        console.log(`${tableName}에는 settlementId 컬럼이 없습니다.`);
        continue;
      }

      // settlement.id 타입 확인
      const [settlementCols] = await connection.query(`
        SHOW FULL COLUMNS FROM settlement WHERE Field = 'id'
      `);
      const settlementType = settlementCols[0].Type;
      const settlementCollation = settlementCols[0].Collation;

      // 현재 타입 확인
      const [currentCols] = await connection.query(`
        SHOW FULL COLUMNS FROM \`${tableName}\` WHERE Field = 'settlementId'
      `);
      const currentType = currentCols[0].Type;
      const currentCollation = currentCols[0].Collation;

      console.log(`settlement.id: ${settlementType} ${settlementCollation || ''}`);
      console.log(`${tableName}.settlementId: ${currentType} ${currentCollation || ''}`);

      // 타입이 다르면 변경
      if (currentType !== settlementType || currentCollation !== settlementCollation) {
        console.log(`\n타입 변경 중...`);
        const alterSQL = `ALTER TABLE \`${tableName}\` MODIFY COLUMN settlementId ${settlementType}${settlementCollation ? ` COLLATE ${settlementCollation}` : ''} NOT NULL`;
        await connection.query(alterSQL);
        console.log('✅ 변경 완료');
      } else {
        console.log('✅ 타입이 이미 일치합니다.');
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

disableFKForTaxInvoice();
