// Check the refresh_token table (singular)
const mysql = require('mysql2/promise');

async function checkRefreshToken() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'leads_db'
  });

  try {
    // Check structure of refresh_token
    const [structure] = await connection.execute(`
      DESCRIBE refresh_token
    `);
    console.log('\n📋 Structure of refresh_token table:\n');
    console.table(structure);
    
    // Check contents
    const [rows] = await connection.execute(`
      SELECT * FROM refresh_token LIMIT 10
    `);
    console.log('\n📊 Contents of refresh_token table:\n');
    if (rows.length === 0) {
      console.log('❌ Table is EMPTY - This table is not being used!\n');
    } else {
      console.table(rows);
    }
    
    // Compare with user_tokens
    const [userTokensStructure] = await connection.execute(`
      DESCRIBE user_tokens
    `);
    console.log('\n📋 Structure of user_tokens table (the one we ARE using):\n');
    console.table(userTokensStructure);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkRefreshToken();
