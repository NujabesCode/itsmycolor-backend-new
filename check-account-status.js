const mysql = require('mysql2/promise');

async function checkAccountStatus() {
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

    // 계정 정보 확인
    const [users] = await connection.query(
      `SELECT id, email, password, role, isActive, loginFailureCount, lockedUntil, createdAt, updatedAt 
       FROM user 
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      console.log(`❌ 이메일 "${email}"로 등록된 계정을 찾을 수 없습니다.`);
      return;
    }

    const user = users[0];
    console.log('=== 계정 전체 상태 ===');
    console.log(`- ID: ${user.id}`);
    console.log(`- 이메일: ${user.email}`);
    console.log(`- 권한: ${user.role}`);
    console.log(`- 활성화 여부: ${user.isActive ? '활성화' : '비활성화'}`);
    console.log(`- 로그인 실패 횟수: ${user.loginFailureCount}`);
    console.log(`- 잠금 만료 시간: ${user.lockedUntil || '없음'}`);
    console.log(`- 비밀번호 존재: ${user.password ? '있음' : '없음'}`);
    console.log(`- 생성일: ${user.createdAt}`);
    console.log(`- 수정일: ${user.updatedAt}\n`);

    // 계정 잠금 해제 및 실패 횟수 초기화
    if (user.lockedUntil || user.loginFailureCount > 0) {
      console.log('계정 잠금 상태를 해제하고 실패 횟수를 초기화합니다...');
      await connection.query(
        'UPDATE user SET lockedUntil = NULL, loginFailureCount = 0 WHERE email = ?',
        [email]
      );
      console.log('✅ 계정 잠금이 해제되었습니다.\n');
    }

    // 비밀번호 확인
    if (!user.password) {
      console.log('⚠️ 비밀번호가 설정되지 않았습니다. 비밀번호를 설정해야 합니다.');
    } else {
      console.log('✅ 비밀번호가 설정되어 있습니다.');
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

checkAccountStatus();
