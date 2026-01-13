const mysql = require('mysql2/promise');

async function fixSettlementIdType() {
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

    // settlement.id의 정확한 타입과 collation 확인
    const [settlementCols] = await connection.query(`
      SHOW FULL COLUMNS FROM settlement WHERE Field = 'id'
    `);
    console.log('=== settlement.id 전체 정보 ===');
    console.log(settlementCols[0]);
    
    const settlementType = settlementCols[0].Type;
    const settlementCollation = settlementCols[0].Collation;
    console.log(`\n타입: ${settlementType}`);
    console.log(`Collation: ${settlementCollation}`);

    // tax_invoice.settlementId의 정확한 타입과 collation 확인
    const [taxInvoiceCols] = await connection.query(`
      SHOW FULL COLUMNS FROM tax_invoice WHERE Field = 'settlementId'
    `);
    console.log('\n=== tax_invoice.settlementId 전체 정보 ===');
    console.log(taxInvoiceCols[0]);
    
    const taxInvoiceType = taxInvoiceCols[0].Type;
    const taxInvoiceCollation = taxInvoiceCols[0].Collation;
    console.log(`\n타입: ${taxInvoiceType}`);
    console.log(`Collation: ${taxInvoiceCollation}`);

    // settlement.id와 정확히 동일하게 변경
    console.log(`\n=== tax_invoice.settlementId를 settlement.id와 동일하게 변경 ===`);
    const alterSQL = `ALTER TABLE tax_invoice MODIFY COLUMN settlementId ${settlementType}${settlementCollation ? ` COLLATE ${settlementCollation}` : ''} NOT NULL`;
    console.log(`실행할 SQL: ${alterSQL}`);
    
    await connection.query(alterSQL);
    console.log('✅ 변경 완료');

    // 확인
    const [finalCols] = await connection.query(`
      SHOW FULL COLUMNS FROM tax_invoice WHERE Field = 'settlementId'
    `);
    console.log('\n=== 변경 후 tax_invoice.settlementId ===');
    console.log(finalCols[0]);

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

fixSettlementIdType();
