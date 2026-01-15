const axios = require('axios');

async function clearIpLock() {
  try {
    console.log('IP 잠금 해제 중...\n');
    
    const response = await axios.post('http://localhost:3000/auth/clear-ip-lock');
    
    console.log('✅ IP 잠금이 해제되었습니다!');
    console.log(`응답: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    if (error.response) {
      console.error('❌ 에러:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.');
    } else {
      console.error('❌ 에러:', error.message);
    }
  }
}

clearIpLock();
