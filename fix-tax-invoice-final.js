const mysql = require('mysql2/promise');

async function fixTaxInvoiceFinal() {
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

    // 1. settlement.id 타입 확인 (CHAR(36) 또는 VARCHAR(36))
    const [settlementCols] = await connection.query(`
      SHOW COLUMNS FROM settlement WHERE Field = 'id'
    `);
    const settlementIdType = settlementCols[0].Type;
    console.log(`settlement.id 타입: ${settlementIdType}`);

    // 2. tax_invoice.settlementId 타입 확인 및 변경
    const [taxInvoiceCols] = await connection.query(`
      SHOW COLUMNS FROM tax_invoice WHERE Field = 'settlementId'
    `);
    console.log(`현재 tax_invoice.settlementId 타입: ${taxInvoiceCols[0].Type}`);

    // 3. settlement.id와 동일한 타입으로 변경
    console.log(`\nsettlementId 컬럼을 ${settlementIdType}로 변경...`);
    await connection.query(`
      ALTER TABLE tax_invoice 
      MODIFY COLUMN settlementId ${settlementIdType} NOT NULL
    `);
    console.log('✅ 타입 변경 완료');

    // 4. 확인
    const [finalCols] = await connection.query(`
      SHOW COLUMNS FROM tax_invoice WHERE Field = 'settlementId'
    `);
    console.log(`\n변경 후 tax_invoice.settlementId 타입: ${finalCols[0].Type}`);

    console.log('\n✅ 모든 작업 완료!');
    console.log('이제 백엔드 서버를 재시작하세요.');

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

fixTaxInvoiceFinal();
