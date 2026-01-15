const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function verifyPassword() {
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
    const testPassword = 'itsmycolor77!';

    // 계정 정보 확인
    const [users] = await connection.query(
      'SELECT id, email, password FROM user WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log(`❌ 이메일 "${email}"로 등록된 계정을 찾을 수 없습니다.`);
      return;
    }

    const user = users[0];
    console.log('=== 계정 정보 ===');
    console.log(`- ID: ${user.id}`);
    console.log(`- 이메일: ${user.email}`);
    console.log(`- 비밀번호 해시: ${user.password ? user.password : 'NULL'}\n`);

    if (!user.password) {
      console.log('❌ 비밀번호가 설정되지 않았습니다.');
      return;
    }

    // 비밀번호 검증
    console.log('=== 비밀번호 검증 ===');
    console.log(`테스트 비밀번호: ${testPassword}`);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ 비밀번호가 일치합니다!\n');
    } else {
      console.log('❌ 비밀번호가 일치하지 않습니다!\n');
      
      // 새로 해시화해서 업데이트
      console.log('비밀번호를 다시 해시화하여 업데이트합니다...');
      const saltRounds = 10;
      const newHashedPassword = await bcrypt.hash(testPassword, saltRounds);
      
      await connection.query(
        'UPDATE user SET password = ? WHERE email = ?',
        [newHashedPassword, email]
      );
      
      console.log('✅ 비밀번호가 업데이트되었습니다.');
      
      // 다시 검증
      const [updatedUsers] = await connection.query(
        'SELECT password FROM user WHERE email = ?',
        [email]
      );
      const updatedUser = updatedUsers[0];
      const isValidAfter = await bcrypt.compare(testPassword, updatedUser.password);
      console.log(`재검증 결과: ${isValidAfter ? '✅ 성공' : '❌ 실패'}\n`);
    }

  } catch (error) {
    console.error('에러:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyPassword();
