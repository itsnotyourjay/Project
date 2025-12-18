// Simple script to generate bcrypt hash for admin password
import * as bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'admin1234';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n=================================');
  console.log('Admin Password Hash Generator');
  console.log('=================================\n');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n=================================');
  console.log('Run this SQL command:');
  console.log('=================================\n');
  console.log(`UPDATE \`user\` SET password = '${hash}', isAdmin = 1 WHERE email = 'admin@example.com';\n`);
  console.log('Or if creating new user:');
  console.log(`INSERT INTO \`user\` (email, password, isAdmin, registeredAt, updatedAt) 
VALUES ('admin@example.com', '${hash}', 1, NOW(), NOW());\n`);
}

generateHash();
