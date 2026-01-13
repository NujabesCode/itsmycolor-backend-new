const mysql = require('mysql2/promise');

async function checkForeignKey() {
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

    // FK_69099a8d7d9ab9f2262ddba52e1 제약 조건 정보 확인
    const [fks] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE CONSTRAINT_NAME = 'FK_69099a8d7d9ab9f2262ddba52e1'
      AND TABLE_SCHEMA = 'itsmycolor'
    `);

    console.log('=== Foreign Key 정보 ===');
    console.log(fks);

    if (fks.length > 0) {
      const fk = fks[0];
      const tableName = fk.TABLE_NAME;
      const columnName = fk.COLUMN_NAME;
      const refTable = fk.REFERENCED_TABLE_NAME;
      const refColumn = fk.REFERENCED_COLUMN_NAME;

      // 참조하는 컬럼 타입 확인
      const [refCols] = await connection.query(`
        SHOW COLUMNS FROM \`${tableName}\` WHERE Field = '${columnName}'
      `);
      console.log(`\n=== ${tableName}.${columnName} 타입 ===`);
      console.log(refCols);

      // 참조되는 컬럼 타입 확인
      const [refTableCols] = await connection.query(`
        SHOW COLUMNS FROM \`${refTable}\` WHERE Field = '${refColumn}'
      `);
      console.log(`\n=== ${refTable}.${refColumn} 타입 ===`);
      console.log(refTableCols);

      // 타입이 다르면 알림
      if (refCols[0] && refTableCols[0]) {
        const colType = refCols[0].Type;
        const refType = refTableCols[0].Type;
        if (colType !== refType) {
          console.log(`\n⚠️ 타입 불일치 발견!`);
          console.log(`${tableName}.${columnName}: ${colType}`);
          console.log(`${refTable}.${refColumn}: ${refType}`);
        }
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

checkForeignKey();
