#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import { createConnection } from 'mysql2/promise';

dotenv.config();

async function main() {
  const drop = process.argv.includes('--drop');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USERNAME || process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'test';

  console.log(`Connecting to ${user}@${host}:${port}/${database}`);
  const conn = await createConnection({ host, port, user, password, database });

  try {
    const [colRes] = await conn.execute<any[]>(
      `SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'currentHashedRefreshToken'`
    );
    const colCount = (colRes as any)[0]?.cnt || 0;
    if (!colCount) {
      console.log('No column `users.currentHashedRefreshToken` found. Nothing to migrate.');
      return;
    }

    const [tableRes] = await conn.execute<any[]>(
      `SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'user_tokens'`
    );
    const tableCount = (tableRes as any)[0]?.cnt || 0;
    if (!tableCount) {
      console.error('Target table `user_tokens` does not exist. Please ensure the backend has created it (run the server with synchronize=true or create the table) before running this migration.');
      return;
    }

    // select users with non-null non-empty tokens
    const [users] = await conn.execute<any[]>(
      `SELECT id AS user_id, currentHashedRefreshToken AS token_hash FROM users WHERE currentHashedRefreshToken IS NOT NULL AND currentHashedRefreshToken <> ''`
    );

    if (!Array.isArray(users) || users.length === 0) {
      console.log('No users with existing refresh tokens found.');
    } else {
      console.log(`Found ${users.length} users with legacy refresh tokens. Inserting into user_tokens...`);
      await conn.beginTransaction();
      try {
        const insertSql = `INSERT INTO user_tokens (user_id, token_hash, expires_at, device_type, ip_address, user_agent, revoked, created_at, updated_at) VALUES (?, ?, NULL, NULL, NULL, NULL, 0, NOW(), NOW())`;
        for (const u of users) {
          await conn.execute(insertSql, [u.user_id, u.token_hash]);
        }
        await conn.commit();
        console.log(`Inserted ${users.length} rows into user_tokens.`);
      } catch (err) {
        await conn.rollback();
        throw err;
      }
    }

    if (drop) {
      console.log('Dropping column users.currentHashedRefreshToken...');
      await conn.execute(`ALTER TABLE users DROP COLUMN currentHashedRefreshToken`);
      console.log('Dropped column.`');
    } else {
      console.log('Skipping DROP COLUMN. Re-run with --drop to remove the legacy column once you have verified the migration.');
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
