const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function fixPasswordFinal() {
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
    const password = 'itsmycolor77!';

    console.log('=== 최종 비밀번호 설정 ===');
    console.log(`이메일: ${email}`);
    console.log(`비밀번호: ${password}\n`);

    // 기존 비밀번호 확인
    const [users] = await connection.query(
      'SELECT id, email, password FROM user WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log(`❌ 계정을 찾을 수 없습니다.`);
      return;
    }

    const user = users[0];
    console.log(`기존 비밀번호 해시: ${user.password ? user.password.substring(0, 30) + '...' : 'NULL'}\n`);

    // 새 비밀번호 해시화 (bcrypt, salt rounds 10)
    console.log('비밀번호 해시화 중...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(`새 해시: ${hashedPassword.substring(0, 30)}...\n`);

    // 비밀번호 업데이트
    await connection.query(
      'UPDATE user SET password = ?, loginFailureCount = 0, lockedUntil = NULL WHERE email = ?',
      [hashedPassword, email]
    );

    console.log('✅ 비밀번호가 업데이트되었습니다.\n');

    // 검증
    const [updatedUsers] = await connection.query(
      'SELECT password FROM user WHERE email = ?',
      [email]
    );
    const updatedUser = updatedUsers[0];
    
    const isValid = await bcrypt.compare(password, updatedUser.password);
    console.log(`비밀번호 검증: ${isValid ? '✅ 성공' : '❌ 실패'}`);
    
    if (isValid) {
      console.log('\n✅ 계정이 정상적으로 설정되었습니다!');
      console.log(`이메일: ${email}`);
      console.log(`비밀번호: ${password}`);
      console.log('\n이제 로그인할 수 있습니다.');
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

fixPasswordFinal();
