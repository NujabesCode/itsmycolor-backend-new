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

    // 모든 foreign key 제약 조건 찾기
    const [allFKs] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'itsmycolor'
      AND TABLE_NAME = 'tax_invoice'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    
    console.log('=== tax_invoice 테이블의 Foreign Key 제약 조건 ===');
    console.log(allFKs);

    // 모든 foreign key 제약 조건 제거
    for (const fk of allFKs) {
      console.log(`\nForeign key 제약 조건 제거: ${fk.CONSTRAINT_NAME}`);
      try {
        await connection.query(`
          ALTER TABLE tax_invoice 
          DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\`
        `);
        console.log('✅ 제거 완료');
      } catch (err) {
        console.log('⚠️ 제거 실패 (이미 없을 수 있음):', err.message);
      }
    }

    // settlementId 컬럼 타입을 varchar(36)로 변경
    console.log('\n=== settlementId 컬럼 타입 변경 ===');
    await connection.query(`
      ALTER TABLE tax_invoice 
      MODIFY COLUMN settlementId VARCHAR(36) NOT NULL
    `);
    console.log('✅ 타입 변경 완료 (varchar(36))');

    // 확인
    const [cols] = await connection.query(`
      SHOW COLUMNS FROM tax_invoice WHERE Field = 'settlementId'
    `);
    console.log('\n=== 변경 후 타입 ===');
    console.log(cols);

    console.log('\n✅ 모든 작업 완료! Foreign key 제약 조건은 제거되었습니다.');
    console.log('TypeORM이 필요시 자동으로 foreign key를 다시 생성할 수 있습니다.');

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
