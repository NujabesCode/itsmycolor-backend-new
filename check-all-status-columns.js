const mysql = require('mysql2/promise');

async function checkAllStatusColumns() {
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

    // 모든 테이블에서 status 컬럼이 있는 테이블 찾기
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'itsmycolor' 
      AND COLUMN_NAME = 'status'
      ORDER BY TABLE_NAME
    `);

    console.log('=== status 컬럼이 있는 테이블들 ===');
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`\n[${tableName}]`);
      
      // 컬럼 타입 확인
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM \`${tableName}\` WHERE Field = 'status'
      `);
      console.log('타입:', columns[0]?.Type || 'N/A');
      
      // 현재 값들 확인
      try {
        const [values] = await connection.query(`
          SELECT DISTINCT status, COUNT(*) as count 
          FROM \`${tableName}\`
          GROUP BY status
          LIMIT 20
        `);
        if (values.length > 0) {
          console.log('값들:', values);
        } else {
          console.log('데이터 없음');
        }
      } catch (err) {
        console.log('값 조회 실패:', err.message);
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

checkAllStatusColumns();
