const mysql = require('mysql2/promise');

async function createFKManually() {
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

    // 기존 foreign key 제약 조건 제거 시도
    const targetFK = 'FK_69099a8d7d9ab9f2262ddba52e1';
    console.log(`기존 foreign key 제약 조건 제거 시도: ${targetFK}`);
    try {
      await connection.query(`
        ALTER TABLE tax_invoice 
        DROP FOREIGN KEY \`${targetFK}\`
      `);
      console.log('✅ 제거 완료');
    } catch (err) {
      console.log('⚠️ 제거 실패 (없을 수 있음):', err.message);
    }

    // 타입 확인
    const [settlementCols] = await connection.query(`
      SHOW FULL COLUMNS FROM settlement WHERE Field = 'id'
    `);
    const [taxInvoiceCols] = await connection.query(`
      SHOW FULL COLUMNS FROM tax_invoice WHERE Field = 'settlementId'
    `);

    console.log(`\nsettlement.id: ${settlementCols[0].Type} ${settlementCols[0].Collation}`);
    console.log(`tax_invoice.settlementId: ${taxInvoiceCols[0].Type} ${taxInvoiceCols[0].Collation}`);

    // Foreign key 생성 시도
    console.log(`\nForeign key 생성 시도...`);
    try {
      await connection.query(`
        ALTER TABLE tax_invoice 
        ADD CONSTRAINT FK_tax_invoice_settlement 
        FOREIGN KEY (settlementId) 
        REFERENCES settlement(id)
        ON DELETE NO ACTION 
        ON UPDATE NO ACTION
      `);
      console.log('✅ Foreign key 생성 완료!');
    } catch (err) {
      console.log('⚠️ Foreign key 생성 실패:', err.message);
      if (err.code === 'ER_FK_INCOMPATIBLE_COLUMNS') {
        console.log('\n컬럼 타입이 여전히 호환되지 않습니다.');
        console.log('타입을 다시 확인하고 수정해야 합니다.');
      }
    }

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

createFKManually();
