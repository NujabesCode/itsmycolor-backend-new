const axios = require('axios');

async function testLogin() {
  try {
    const email = 'itsmycolorlab@naver.com';
    const password = 'itsmycolor77!';
    
    console.log('로그인 테스트 시작...\n');
    console.log(`이메일: ${email}`);
    console.log(`비밀번호: ${password}\n`);

    const response = await axios.post('http://localhost:3000/auth/login', {
      email,
      password,
    });

    console.log('✅ 로그인 성공!');
    console.log('\n응답 데이터:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.hasBrand !== undefined) {
      console.log(`\nhasBrand: ${response.data.hasBrand}`);
    }
    if (response.data.isBrandApproved !== undefined) {
      console.log(`isBrandApproved: ${response.data.isBrandApproved}`);
    }

  } catch (error) {
    console.error('❌ 로그인 실패!');
    if (error.response) {
      console.error(`상태 코드: ${error.response.status}`);
      console.error(`에러 메시지: ${error.response.data?.message || error.response.data}`);
      console.error('\n전체 응답:');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('에러:', error.message);
    }
  }
}

testLogin();
