// Check both tables
const mysql = require('mysql2/promise');

async function checkBothTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Add your password if needed
    database: 'leads_db'
  });

  try {
    // Check if refresh_tokens table exists
    console.log('\n📋 Checking database tables...\n');
    
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE '%token%'
    `);
    
    console.log('Tables with "token" in name:');
    console.table(tables);
    
    // Try to check refresh_tokens
    try {
      const [refreshRows] = await connection.execute(`
        SELECT * FROM refresh_tokens LIMIT 5
      `);
      console.log('\n📊 refresh_tokens table:');
      console.table(refreshRows);
    } catch (error) {
      console.log('\n❌ refresh_tokens table does not exist or has error:', error.message);
    }
    
    // Check user_tokens
    try {
      const [userTokenRows] = await connection.execute(`
        SELECT COUNT(*) as count FROM user_tokens
      `);
      console.log('\n✅ user_tokens table exists with', userTokenRows[0].count, 'rows');
      
      const [recent] = await connection.execute(`
        SELECT id, user_id, device_type, ip_address, created_at 
        FROM user_tokens 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      console.log('\nMost recent user_tokens:');
      console.table(recent);
    } catch (error) {
      console.log('\n❌ user_tokens table error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkBothTables();
