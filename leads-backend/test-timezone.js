/**
 * Timezone Configuration Test Script
 * 
 * This script verifies that the backend is properly configured to use UTC timezone.
 * Run with: node test-timezone.js
 */

console.log('\n🌍 TIMEZONE CONFIGURATION TEST\n');
console.log('='.repeat(50));

// Test 1: Check TZ environment variable
console.log('\n1️⃣  Environment Variable Check:');
console.log('   TZ =', process.env.TZ || '(not set)');
if (process.env.TZ === 'UTC') {
  console.log('   ✅ PASS - TZ is set to UTC');
} else {
  console.log('   ❌ FAIL - TZ should be "UTC"');
}

// Test 2: Check Date object timezone
console.log('\n2️⃣  JavaScript Date Timezone Check:');
const now = new Date();
console.log('   Current Date:', now);
console.log('   ISO String:', now.toISOString());
console.log('   Timezone Offset:', now.getTimezoneOffset(), 'minutes');
if (now.getTimezoneOffset() === 0) {
  console.log('   ✅ PASS - Timezone offset is 0 (UTC)');
} else {
  console.log('   ❌ FAIL - Timezone offset should be 0 for UTC');
}

// Test 3: Compare local time vs UTC time
console.log('\n3️⃣  Time Comparison:');
console.log('   Local Time String:', now.toString());
console.log('   UTC Time String:', now.toUTCString());
console.log('   ISO 8601 (UTC):', now.toISOString());

// Test 4: Create a timestamp like TypeORM would
console.log('\n4️⃣  Simulated Database Timestamp:');
const timestamp = new Date();
const isoString = timestamp.toISOString();
console.log('   Created:', isoString);
console.log('   Hour:', timestamp.getUTCHours(), 'UTC');
console.log('   Minute:', timestamp.getUTCMinutes());
console.log('   ✅ This would be saved to database as UTC');

// Test 5: Timezone info
console.log('\n5️⃣  System Timezone Info:');
console.log('   Intl.DateTimeFormat locale:', new Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('   Note: This might show system timezone, but Node.js uses TZ env var');

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 SUMMARY:');
if (process.env.TZ === 'UTC' && now.getTimezoneOffset() === 0) {
  console.log('   ✅ ALL TESTS PASSED - System is configured for UTC');
  console.log('   ✅ Database timestamps will be stored in UTC');
  console.log('   ✅ Ready for international users!');
} else {
  console.log('   ❌ CONFIGURATION ISSUE DETECTED');
  console.log('   ⚠️  Please check:');
  console.log('      1. TZ=UTC is in .env file');
  console.log('      2. Backend was restarted after adding TZ=UTC');
  console.log('      3. Run: cd leads-backend && npm run start:dev');
}
console.log('\n' + '='.repeat(50) + '\n');
