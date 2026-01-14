// Check the very latest token in detail
const mysql = require('mysql2/promise');

async function checkLatestToken() {
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
        user_agent,
        revoked,
        created_at 
      FROM user_tokens 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (rows.length > 0) {
      console.log('\n✅ LATEST TOKEN (Most Recent):\n');
      console.log('ID:', rows[0].id);
      console.log('User ID:', rows[0].user_id);
      console.log('Device Type:', rows[0].device_type);
      console.log('IP Address:', rows[0].ip_address);
      console.log('User Agent:', rows[0].user_agent);
      console.log('Revoked:', rows[0].revoked);
      console.log('Created At:', rows[0].created_at);
      
      if (rows[0].device_type && rows[0].ip_address && rows[0].user_agent) {
        console.log('\n🎉 SUCCESS! All metadata fields are populated!\n');
      } else {
        console.log('\n❌ ISSUE: Some metadata fields are NULL\n');
        console.log('Missing fields:');
        if (!rows[0].device_type) console.log('  - device_type');
        if (!rows[0].ip_address) console.log('  - ip_address');
        if (!rows[0].user_agent) console.log('  - user_agent');
      }
    } else {
      console.log('No tokens found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkLatestToken();
