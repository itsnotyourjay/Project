// Quick script to check user_tokens table
const mysql = require('mysql2/promise');

async function checkTokens() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Add your password if needed
    database: 'leads_db'
  });

  try {
    const [rows] = await connection.execute(`
      SELECT 
        id, 
        user_id, 
        device_type, 
        ip_address, 
        LEFT(user_agent, 80) as user_agent_preview,
        revoked,
        created_at 
      FROM user_tokens 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    console.log('\n📊 User Tokens Table (Last 10 entries):\n');
    console.table(rows);
    
    // Count tokens with metadata
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(device_type) as has_device_type,
        COUNT(ip_address) as has_ip,
        COUNT(user_agent) as has_user_agent
      FROM user_tokens
    `);
    
    console.log('\n📈 Metadata Statistics:\n');
    console.table(stats);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTokens();
