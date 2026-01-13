const mysql = require('mysql2/promise');

async function removeFKConstraints() {
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
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'itsmycolor'
      AND TABLE_NAME = 'tax_invoice'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    
    console.log('=== tax_invoice 테이블의 Foreign Key 제약 조건 ===');
    console.log(fks);

    // FK_69099a8d7d9ab9f2262ddba52e1 제약 조건 제거 시도
    const targetFK = 'FK_69099a8d7d9ab9f2262ddba52e1';
    console.log(`\n=== ${targetFK} 제약 조건 제거 시도 ===`);
    
    try {
      await connection.query(`
        ALTER TABLE tax_invoice 
        DROP FOREIGN KEY \`${targetFK}\`
      `);
      console.log(`✅ ${targetFK} 제거 완료`);
    } catch (err) {
      console.log(`⚠️ ${targetFK} 제거 실패:`, err.message);
      // 다른 이름으로 존재할 수 있으므로 모든 FK 제거 시도
      if (fks.length > 0) {
        for (const fk of fks) {
          try {
            console.log(`\n다른 FK 제약 조건 제거 시도: ${fk.CONSTRAINT_NAME}`);
            await connection.query(`
              ALTER TABLE tax_invoice 
              DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\`
            `);
            console.log(`✅ ${fk.CONSTRAINT_NAME} 제거 완료`);
          } catch (e) {
            console.log(`⚠️ ${fk.CONSTRAINT_NAME} 제거 실패:`, e.message);
          }
        }
      }
    }

    // 모든 테이블에서 FK_69099a8d7d9ab9f2262ddba52e1 이름의 제약 조건 찾기
    const [allFKs] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'itsmycolor'
      AND CONSTRAINT_NAME = 'FK_69099a8d7d9ab9f2262ddba52e1'
    `);
    
    if (allFKs.length > 0) {
      console.log(`\n⚠️ ${targetFK}가 다른 테이블에 존재함:`);
      for (const fk of allFKs) {
        console.log(`  - ${fk.TABLE_NAME}`);
        try {
          await connection.query(`
            ALTER TABLE \`${fk.TABLE_NAME}\` 
            DROP FOREIGN KEY \`${targetFK}\`
          `);
          console.log(`  ✅ ${fk.TABLE_NAME}에서 제거 완료`);
        } catch (e) {
          console.log(`  ⚠️ ${fk.TABLE_NAME}에서 제거 실패:`, e.message);
        }
      }
    }

    // 최종 확인
    const [finalFKs] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'itsmycolor'
      AND TABLE_NAME = 'tax_invoice'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    
    console.log('\n=== 최종 확인: tax_invoice의 Foreign Key ===');
    if (finalFKs.length === 0) {
      console.log('✅ 모든 Foreign Key 제약 조건이 제거되었습니다.');
    } else {
      console.log('⚠️ 남아있는 Foreign Key:', finalFKs);
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

removeFKConstraints();
