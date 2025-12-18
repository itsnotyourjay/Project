// Quick test to verify token creation is working
const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Testing login...');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }, {
      withCredentials: true,
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    console.log('Cookies:', response.headers['set-cookie']);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Login successful!');
      console.log('\n📊 Now check the database:');
      console.log('   SELECT * FROM user_tokens;');
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
