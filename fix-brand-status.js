const mysql = require('mysql2/promise');

async function fixBrandStatus() {
  let connection;
  try {
    // 데이터베이스 연결
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '0000',
      database: 'itsmycolor',
    });

    console.log('데이터베이스 연결 성공');

    // 1. 현재 status 컬럼 타입 확인
    const [columns] = await connection.query("SHOW COLUMNS FROM brand WHERE Field = 'status'");
    console.log('\n=== status 컬럼 타입 ===');
    console.log(columns);

    // 2. 현재 status 값들 확인
    const [statuses] = await connection.query(`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM brand 
      GROUP BY status
    `);
    console.log('\n=== 현재 status 값들 ===');
    console.log(statuses);

    // 3. enum에 맞지 않는 값 확인
    const validStatuses = ['심사중', '승인됨', '거부됨', '재심사 요청'];
    const invalidStatuses = statuses.filter(s => !validStatuses.includes(s.status));

    if (invalidStatuses.length > 0) {
      console.log('\n=== 잘못된 status 값들 발견 ===');
      console.log(invalidStatuses);

      // 4. 잘못된 값을 기본값('심사중')으로 변경
      for (const invalid of invalidStatuses) {
        console.log(`\n${invalid.status} 값을 '심사중'으로 변경 중...`);
        await connection.query(
          "UPDATE brand SET status = ? WHERE status = ?",
          ['심사중', invalid.status]
        );
        console.log(`${invalid.count}개 레코드 수정 완료`);
      }

      // 5. 수정 후 다시 확인
      const [afterStatuses] = await connection.query(`
        SELECT DISTINCT status, COUNT(*) as count 
        FROM brand 
        GROUP BY status
      `);
      console.log('\n=== 수정 후 status 값들 ===');
      console.log(afterStatuses);
    } else {
      console.log('\n모든 status 값이 유효합니다.');
    }

    console.log('\n완료!');
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

fixBrandStatus();
