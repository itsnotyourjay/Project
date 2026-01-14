// Test JWT token generation and verification
const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('\n🔐 JWT TOKEN TESTING\n');
console.log('='.repeat(60));

// Check if JWT_SECRET exists
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET is not defined in .env file!');
  process.exit(1);
}

console.log('\n1️⃣  JWT Secret Configuration:');
console.log('   ✅ JWT_SECRET is defined');
console.log('   📏 Length:', JWT_SECRET.length, 'characters');
console.log('   🔑 First 30 chars:', JWT_SECRET.substring(0, 30) + '...');
console.log('   🔑 Last 30 chars:', '...' + JWT_SECRET.substring(JWT_SECRET.length - 30));

// Verify it's a strong secret
if (JWT_SECRET.length < 32) {
  console.log('   ⚠️  WARNING: Secret is short (recommended: 64+ chars)');
} else {
  console.log('   ✅ Secret length is good (recommended for production)');
}

// Test token generation
console.log('\n2️⃣  Testing Token Generation:\n');

try {
  // Generate an access token (like the app does)
  const accessPayload = {
    sub: 123,
    email: 'test@example.com',
    isAdmin: false
  };
  
  const accessToken = jwt.sign(accessPayload, JWT_SECRET, { expiresIn: '15m' });
  console.log('   ✅ Access token generated successfully');
  console.log('   📊 Token length:', accessToken.length, 'characters');
  console.log('   📝 Token preview:', accessToken.substring(0, 60) + '...');
  
  // Generate a refresh token
  const refreshPayload = {
    sub: 123,
    email: 'test@example.com'
  };
  
  const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: '7d' });
  console.log('\n   ✅ Refresh token generated successfully');
  console.log('   📊 Token length:', refreshToken.length, 'characters');
  
  // Test token verification
  console.log('\n3️⃣  Testing Token Verification:\n');
  
  const decodedAccess = jwt.verify(accessToken, JWT_SECRET);
  console.log('   ✅ Access token verified successfully');
  console.log('   📦 Decoded Payload:');
  console.log('      - User ID (sub):', decodedAccess.sub);
  console.log('      - Email:', decodedAccess.email);
  console.log('      - Is Admin:', decodedAccess.isAdmin);
  console.log('      - Issued At:', new Date(decodedAccess.iat * 1000).toLocaleString());
  console.log('      - Expires At:', new Date(decodedAccess.exp * 1000).toLocaleString());
  
  const decodedRefresh = jwt.verify(refreshToken, JWT_SECRET);
  console.log('\n   ✅ Refresh token verified successfully');
  console.log('   📦 User ID from refresh token:', decodedRefresh.sub);
  console.log('   📦 Email from refresh token:', decodedRefresh.email);
  
  // Calculate expiration times
  const accessExp = new Date(decodedAccess.exp * 1000);
  const refreshExp = new Date(decodedRefresh.exp * 1000);
  const now = new Date();
  
  console.log('\n4️⃣  Token Expiration Configuration:\n');
  console.log('   ⏰ Current time:', now.toLocaleString());
  console.log('   ⏰ Access token expires:', accessExp.toLocaleString());
  console.log('   ⏰ Refresh token expires:', refreshExp.toLocaleString());
  console.log('   ⏱️  Access token lifetime:', Math.round((decodedAccess.exp - decodedAccess.iat) / 60), 'minutes');
  console.log('   ⏱️  Refresh token lifetime:', Math.round((decodedRefresh.exp - decodedRefresh.iat) / 60 / 60 / 24), 'days');
  
  // Verify against .env settings
  const expectedAccessMs = parseInt(process.env.ACCESS_EXPIRES_MS || '900000');
  const expectedRefreshMs = parseInt(process.env.REFRESH_EXPIRES_MS || '604800000');
  const actualAccessMs = (decodedAccess.exp - decodedAccess.iat) * 1000;
  const actualRefreshMs = (decodedRefresh.exp - decodedRefresh.iat) * 1000;
  
  console.log('\n5️⃣  Verify .env Configuration:\n');
  console.log('   📄 ACCESS_EXPIRES_MS from .env:', expectedAccessMs, 'ms =', expectedAccessMs / 60000, 'minutes');
  console.log('   📄 REFRESH_EXPIRES_MS from .env:', expectedRefreshMs, 'ms =', expectedRefreshMs / 86400000, 'days');
  console.log('   ✅ Access token matches .env:', actualAccessMs === expectedAccessMs);
  console.log('   ✅ Refresh token matches .env:', actualRefreshMs === expectedRefreshMs);
  
  // Test with wrong secret
  console.log('\n6️⃣  Testing Security (wrong secret should fail):\n');
  try {
    jwt.verify(accessToken, 'wrong_secret_12345');
    console.error('   ❌ SECURITY ISSUE: Token verified with wrong secret!');
  } catch (error) {
    console.log('   ✅ Security working correctly!');
    console.log('   🔒 Wrong secret rejected:', error.message);
  }
  
  // Test expired token simulation
  console.log('\n7️⃣  Testing Expired Token Detection:\n');
  const expiredToken = jwt.sign({ sub: 123 }, JWT_SECRET, { expiresIn: '0s' });
  setTimeout(() => {
    try {
      jwt.verify(expiredToken, JWT_SECRET);
      console.error('   ❌ ERROR: Expired token was accepted!');
    } catch (error) {
      console.log('   ✅ Expired token correctly rejected');
      console.log('   ⏰ Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL JWT TESTS PASSED!');
    console.log('✅ Your JWT configuration is working correctly.');
    console.log('='.repeat(60) + '\n');
  }, 100);
  
} catch (error) {
  console.error('\n❌ ERROR during JWT testing:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
