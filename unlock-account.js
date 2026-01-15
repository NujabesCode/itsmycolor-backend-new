const mysql = require('mysql2/promise');

async function unlockAccount() {
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

    const email = 'itsmycolorlab@naver.com';

    // 계정 확인
    const [users] = await connection.query(
      'SELECT id, email, loginFailureCount, lockedUntil FROM user WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log(`❌ 이메일 "${email}"로 등록된 계정을 찾을 수 없습니다.`);
      return;
    }

    const user = users[0];
    console.log('현재 계정 상태:');
    console.log(`- 이메일: ${user.email}`);
    console.log(`- 로그인 실패 횟수: ${user.loginFailureCount}`);
    console.log(`- 잠금 만료 시간: ${user.lockedUntil || '없음'}\n`);

    // 계정 잠금 해제
    await connection.query(
      'UPDATE user SET loginFailureCount = 0, lockedUntil = NULL WHERE email = ?',
      [email]
    );

    console.log('✅ 계정 잠금이 해제되었습니다!');
    console.log(`- 로그인 실패 횟수: 0으로 초기화`);
    console.log(`- 잠금 만료 시간: NULL로 설정\n`);

    // 확인
    const [updatedUsers] = await connection.query(
      'SELECT id, email, loginFailureCount, lockedUntil FROM user WHERE email = ?',
      [email]
    );
    const updatedUser = updatedUsers[0];
    console.log('업데이트된 계정 상태:');
    console.log(`- 이메일: ${updatedUser.email}`);
    console.log(`- 로그인 실패 횟수: ${updatedUser.loginFailureCount}`);
    console.log(`- 잠금 만료 시간: ${updatedUser.lockedUntil || '없음'}`);

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

unlockAccount();
