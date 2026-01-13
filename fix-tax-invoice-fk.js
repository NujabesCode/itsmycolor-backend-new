const mysql = require('mysql2/promise');

async function fixTaxInvoiceFK() {
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

    // tax_invoice 테이블의 settlementId 컬럼 타입 확인
    const [taxInvoiceCols] = await connection.query(`
      SHOW COLUMNS FROM tax_invoice WHERE Field = 'settlementId'
    `);
    console.log('=== tax_invoice.settlementId 타입 ===');
    console.log(taxInvoiceCols);

    // settlement 테이블의 id 컬럼 타입 확인
    const [settlementCols] = await connection.query(`
      SHOW COLUMNS FROM settlement WHERE Field = 'id'
    `);
    console.log('\n=== settlement.id 타입 ===');
    console.log(settlementCols);

    // Foreign key 제약 조건 확인
    const [constraints] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'itsmycolor'
      AND TABLE_NAME = 'tax_invoice'
      AND COLUMN_NAME = 'settlementId'
    `);
    console.log('\n=== tax_invoice.settlementId Foreign Key 정보 ===');
    console.log(constraints);

    // 타입이 다르면 수정
    if (taxInvoiceCols[0] && settlementCols[0]) {
      const taxInvoiceType = taxInvoiceCols[0].Type;
      const settlementType = settlementCols[0].Type;
      
      console.log(`\ntax_invoice.settlementId: ${taxInvoiceType}`);
      console.log(`settlement.id: ${settlementType}`);

      if (taxInvoiceType !== settlementType) {
        console.log('\n⚠️ 타입 불일치 발견! 수정 중...');
        
        // 기존 foreign key 제약 조건 제거
        if (constraints.length > 0) {
          const constraintName = constraints[0].CONSTRAINT_NAME;
          console.log(`\nForeign key 제약 조건 제거: ${constraintName}`);
          await connection.query(`
            ALTER TABLE tax_invoice 
            DROP FOREIGN KEY \`${constraintName}\`
          `);
        }

        // settlementId 컬럼 타입을 settlement.id와 동일하게 변경
        console.log(`\nsettlementId 컬럼 타입을 ${settlementType}로 변경...`);
        await connection.query(`
          ALTER TABLE tax_invoice 
          MODIFY COLUMN settlementId ${settlementType}
        `);

        // Foreign key 제약 조건 다시 추가
        console.log('\nForeign key 제약 조건 다시 추가...');
        await connection.query(`
          ALTER TABLE tax_invoice 
          ADD CONSTRAINT FK_tax_invoice_settlement 
          FOREIGN KEY (settlementId) 
          REFERENCES settlement(id)
        `);

        console.log('\n✅ 수정 완료!');
      } else {
        console.log('\n✅ 타입이 일치합니다.');
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

fixTaxInvoiceFK();
