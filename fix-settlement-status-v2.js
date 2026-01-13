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

    // 1. 먼저 enum 타입을 변경 (임시로 varchar로 변경)
    console.log('=== 1단계: enum 타입을 varchar로 변경 ===');
    await connection.query(`
      ALTER TABLE settlement 
      MODIFY COLUMN status VARCHAR(50) 
      DEFAULT '정산대기'
    `);
    console.log('완료!');

    // 2. 데이터 업데이트
    console.log('\n=== 2단계: 데이터 값 업데이트 ===');
    const [result] = await connection.query(`
      SELECT COUNT(*) as count
      FROM settlement
      WHERE status = '정산완료'
    `);

    if (result[0].count > 0) {
      console.log(`'정산완료' 값을 '지급 완료'로 변경 중... (${result[0].count}개)`);
      await connection.query(`
        UPDATE settlement 
        SET status = '지급 완료' 
        WHERE status = '정산완료'
      `);
      console.log('변경 완료!');
    }

    // 3. enum 타입으로 다시 변경
    console.log('\n=== 3단계: enum 타입으로 재변경 ===');
    await connection.query(`
      ALTER TABLE settlement 
      MODIFY COLUMN status ENUM('정산대기','지급 예정','지급 완료') 
      DEFAULT '정산대기'
    `);
    console.log('완료!');

    // 4. 확인
    const [afterStatuses] = await connection.query(`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM settlement
      GROUP BY status
    `);
    console.log('\n=== 최종 settlement status 값들 ===');
    console.log(afterStatuses);

    console.log('\n✅ 모든 작업 완료!');
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
