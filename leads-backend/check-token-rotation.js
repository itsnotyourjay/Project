// Check token rotation in action
const mysql = require('mysql2/promise');

async function checkTokenRotation() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'leads_db'
  });

  try {
    // Show tokens for a specific user with revoked status
    console.log('\n📊 Token Rotation Example (User 16):\n');
    
    const [tokens] = await connection.execute(`
      SELECT 
        LEFT(id, 8) as token_id,
        user_id,
        device_type,
        revoked,
        LEFT(replaced_by, 8) as replaced_by_id,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created,
        DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s') as expires
      FROM user_tokens 
      WHERE user_id = 16
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.table(tokens);
    
    console.log('\n📖 How to read this:');
    console.log('- revoked: 0 = Active token (current session)');
    console.log('- revoked: 1 = Old token (replaced during refresh)');
    console.log('- replaced_by_id: Shows which new token replaced this one');
    console.log('- Token rotation happens every time access token expires (15 min)');
    
    // Count active vs revoked
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_tokens,
        SUM(revoked = 0) as active_tokens,
        SUM(revoked = 1) as revoked_tokens
      FROM user_tokens
    `);
    
    console.log('\n📈 Overall Token Statistics:\n');
    console.table(stats);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTokenRotation();
