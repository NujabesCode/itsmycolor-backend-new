const mysql = require('mysql2/promise');

async function removeFKCompletely() {
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

    // tax_invoice 테이블의 모든 foreign key 제약 조건 찾기
    const [fks] = await connection.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'itsmycolor'
      AND TABLE_NAME = 'tax_invoice'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    
    console.log('=== tax_invoice의 모든 Foreign Key ===');
    console.log(fks.map(fk => fk.CONSTRAINT_NAME));

    // 모든 foreign key 제거
    for (const fk of fks) {
      const fkName = fk.CONSTRAINT_NAME;
      console.log(`\n${fkName} 제거 중...`);
      try {
        await connection.query(`
          ALTER TABLE tax_invoice 
          DROP FOREIGN KEY \`${fkName}\`
        `);
        console.log(`✅ ${fkName} 제거 완료`);
      } catch (err) {
        console.log(`⚠️ ${fkName} 제거 실패:`, err.message);
      }
    }

    // 확인
    const [finalFKs] = await connection.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'itsmycolor'
      AND TABLE_NAME = 'tax_invoice'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    
    if (finalFKs.length === 0) {
      console.log('\n✅ 모든 Foreign Key 제약 조건이 제거되었습니다.');
    } else {
      console.log('\n⚠️ 남아있는 Foreign Key:', finalFKs.map(fk => fk.CONSTRAINT_NAME));
    }

    console.log('\n✅ 작업 완료!');

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

removeFKCompletely();
