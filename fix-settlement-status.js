const mysql = require('mysql2/promise');

async function fixSettlementStatus() {
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

    // 현재 status 값 확인
    const [statuses] = await connection.query(`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM settlement
      GROUP BY status
    `);
    console.log('=== 현재 settlement status 값들 ===');
    console.log(statuses);

    // 코드의 enum: '정산대기','지급 예정','지급 완료'
    // 데이터베이스에 '정산완료'가 있으면 '지급 완료'로 변경
    const [result] = await connection.query(`
      SELECT COUNT(*) as count
      FROM settlement
      WHERE status = '정산완료'
    `);

    if (result[0].count > 0) {
      console.log(`\n'정산완료' 값을 '지급 완료'로 변경 중... (${result[0].count}개)`);
      await connection.query(`
        UPDATE settlement 
        SET status = '지급 완료' 
        WHERE status = '정산완료'
      `);
      console.log('변경 완료!');
    }

    // 변경 후 확인
    const [afterStatuses] = await connection.query(`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM settlement
      GROUP BY status
    `);
    console.log('\n=== 변경 후 settlement status 값들 ===');
    console.log(afterStatuses);

    // enum 타입도 업데이트 (필요시)
    console.log('\n=== enum 타입 업데이트 중... ===');
    await connection.query(`
      ALTER TABLE settlement 
      MODIFY COLUMN status ENUM('정산대기','지급 예정','지급 완료') 
      DEFAULT '정산대기'
    `);
    console.log('enum 타입 업데이트 완료!');

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

fixSettlementStatus();
