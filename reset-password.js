const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function resetPassword() {
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
    const newPassword = 'itsmycolor77!';

    // 계정 확인
    const [users] = await connection.query(
      'SELECT id, email, password FROM user WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log(`❌ 이메일 "${email}"로 등록된 계정을 찾을 수 없습니다.`);
      return;
    }

    const user = users[0];
    console.log('계정 정보:');
    console.log(`- ID: ${user.id}`);
    console.log(`- 이메일: ${user.email}`);
    console.log(`- 현재 비밀번호 해시: ${user.password ? user.password.substring(0, 20) + '...' : '없음'}\n`);

    // 비밀번호 해시화
    console.log('비밀번호 해시화 중...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log(`새 비밀번호 해시: ${hashedPassword.substring(0, 20)}...\n`);

    // 비밀번호 업데이트
    await connection.query(
      'UPDATE user SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );

    console.log('✅ 비밀번호가 성공적으로 재설정되었습니다!');
    console.log(`- 이메일: ${email}`);
    console.log(`- 새 비밀번호: ${newPassword}\n`);

    // 확인: 해시된 비밀번호로 검증 테스트
    const [updatedUsers] = await connection.query(
      'SELECT password FROM user WHERE email = ?',
      [email]
    );
    const updatedUser = updatedUsers[0];
    const isValid = await bcrypt.compare(newPassword, updatedUser.password);
    console.log(`비밀번호 검증 테스트: ${isValid ? '✅ 성공' : '❌ 실패'}`);

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

resetPassword();
