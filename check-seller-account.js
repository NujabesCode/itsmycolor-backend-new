const mysql = require('mysql2/promise');

async function checkSellerAccount() {
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
      `SELECT id, email, role, isActive, loginFailureCount, lockedUntil 
       FROM user 
       WHERE email = ?`,
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
    console.log(`- 권한 (role): ${user.role}`);
    console.log(`- 활성화 여부: ${user.isActive}`);
    console.log(`- 로그인 실패 횟수: ${user.loginFailureCount}`);
    console.log(`- 잠금 만료 시간: ${user.lockedUntil || '없음'}\n`);

    // 브랜드 정보 확인
    const [brands] = await connection.query(
      `SELECT id, name, status, userId 
       FROM brand 
       WHERE userId = ?`,
      [user.id]
    );

    console.log('=== 브랜드 정보 ===');
    if (brands.length === 0) {
      console.log('❌ 등록된 브랜드가 없습니다.');
      console.log('   → 판매자 페이지 접근을 위해서는 브랜드 입점 신청이 필요합니다.\n');
    } else {
      brands.forEach((brand, index) => {
        console.log(`\n브랜드 ${index + 1}:`);
        console.log(`- ID: ${brand.id}`);
        console.log(`- 이름: ${brand.name}`);
        console.log(`- 상태: ${brand.status}`);
        console.log(`- 사용자 ID: ${brand.userId}`);
        
        if (brand.status === 'APPROVED') {
          console.log('  ✅ 브랜드가 승인되었습니다.');
        } else if (brand.status === 'PENDING') {
          console.log('  ⏳ 브랜드 심사 중입니다.');
        } else if (brand.status === 'REJECTED') {
          console.log('  ❌ 브랜드가 거절되었습니다.');
        }
      });
      console.log('');
    }

    // 권한 확인
    console.log('=== 권한 확인 ===');
    if (user.role !== '브랜드 관리자') {
      console.log(`❌ 현재 권한: "${user.role}"`);
      console.log(`   → 판매자 페이지 접근을 위해서는 "브랜드 관리자" 권한이 필요합니다.\n`);
    } else {
      console.log('✅ 권한: 브랜드 관리자\n');
    }

    // 종합 판단
    console.log('=== 종합 판단 ===');
    const issues = [];
    
    if (user.role !== '브랜드 관리자') {
      issues.push('계정 권한이 "브랜드 관리자"가 아닙니다.');
    }
    
    if (brands.length === 0) {
      issues.push('등록된 브랜드가 없습니다.');
    } else {
      const approvedBrand = brands.find(b => b.status === '승인됨');
      if (!approvedBrand) {
        issues.push('승인된 브랜드가 없습니다.');
        console.log(`   현재 브랜드 상태: "${brands[0].status}"`);
      }
    }

    if (issues.length === 0) {
      console.log('✅ 판매자 페이지 접근 가능합니다!\n');
    } else {
      console.log('❌ 판매자 페이지 접근 불가능합니다:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      console.log('');
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

checkSellerAccount();
