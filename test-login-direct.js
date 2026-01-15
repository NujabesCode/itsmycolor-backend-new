const axios = require('axios');

async function testLoginDirect() {
  const email = 'itsmycolorlab@naver.com';
  const password = 'itsmycolor77!';
  
  console.log('=== 직접 로그인 테스트 ===\n');
  console.log(`이메일: ${email}`);
  console.log(`비밀번호: ${password}`);
  console.log(`비밀번호 길이: ${password.length}`);
  console.log(`비밀번호 문자 코드:`, password.split('').map(c => c.charCodeAt(0)).join(', '));
  console.log('\n');

  // 여러 가능한 API 엔드포인트 테스트
  const endpoints = [
    'http://localhost:3000/auth/login',
    'http://61.76.19.173:3000/auth/login',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`테스트 중: ${endpoint}`);
      const response = await axios.post(endpoint, {
        email,
        password,
      }, {
        timeout: 5000,
      });

      console.log('✅ 로그인 성공!');
      console.log(`- hasBrand: ${response.data.hasBrand}`);
      console.log(`- isBrandApproved: ${response.data.isBrandApproved}`);
      console.log(`- accessToken 존재: ${!!response.data.accessToken}\n`);
      return;
    } catch (error) {
      if (error.response) {
        console.log(`❌ 로그인 실패: ${error.response.data?.message || error.response.data}`);
        console.log(`   상태 코드: ${error.response.status}\n`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`❌ 연결 실패: 서버에 연결할 수 없습니다.\n`);
      } else {
        console.log(`❌ 에러: ${error.message}\n`);
      }
    }
  }
}

testLoginDirect();
