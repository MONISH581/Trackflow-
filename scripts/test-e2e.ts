import pg from 'pg';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[FAIL] DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runTests() {
  console.log('\n======================================================');
  console.log('         Neon PostgreSQL End-to-End Verification      ');
  console.log('======================================================\n');

  try {
    // 1. Test database connection
    const client = await pool.connect();
    console.log('[1/4] Connecting to Neon Lakebase Postgres...');
    const infoRes = await client.query('SELECT NOW() AS now, current_database() AS db, version() AS version');
    console.log('  ✓ Connected to database:', infoRes.rows[0].db);
    console.log('  ✓ Server time:', infoRes.rows[0].now);
    console.log('  ✓ Version:', infoRes.rows[0].version.split(' ')[0], infoRes.rows[0].version.split(' ')[1]);

    // 2. Test reading migrated data from Neon
    console.log('\n[2/4] Verifying migrated tables and records...');
    const usersRes = await client.query('SELECT COUNT(*) AS count FROM users');
    const hackathonsRes = await client.query('SELECT COUNT(*) AS count FROM hackathons');
    const oppsRes = await client.query('SELECT COUNT(*) AS count FROM opportunities');
    console.log(`  ✓ Table 'users': ${usersRes.rows[0].count} records`);
    console.log(`  ✓ Table 'hackathons': ${hackathonsRes.rows[0].count} records`);
    console.log(`  ✓ Table 'opportunities': ${oppsRes.rows[0].count} records`);

    // 3. Test CRUD operations on Neon
    console.log('\n[3/4] Testing full CRUD cycle on Neon PostgreSQL...');
    const testId = `test_${Date.now()}`;
    const testData = { id: testId, name: 'Neon E2E Test Record', status: 'ACTIVE' };

    // INSERT
    await client.query(
      'INSERT INTO "sessions" (id, data, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
      [testId, JSON.stringify(testData)]
    );
    console.log('  ✓ INSERT operation succeeded');

    // READ
    const readRes = await client.query('SELECT data FROM "sessions" WHERE id = $1', [testId]);
    if (readRes.rows.length === 0 || readRes.rows[0].data.name !== testData.name) {
      throw new Error('Read back data did not match inserted data');
    }
    console.log('  ✓ SELECT operation succeeded:', readRes.rows[0].data.name);

    // UPDATE
    const updatedData = { ...testData, name: 'Neon E2E Updated Record' };
    await client.query(
      'UPDATE "sessions" SET data = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedData), testId]
    );
    const updatedRes = await client.query('SELECT data FROM "sessions" WHERE id = $1', [testId]);
    if (updatedRes.rows[0].data.name !== 'Neon E2E Updated Record') {
      throw new Error('Update failed');
    }
    console.log('  ✓ UPDATE operation succeeded:', updatedRes.rows[0].data.name);

    // DELETE
    await client.query('DELETE FROM "sessions" WHERE id = $1', [testId]);
    const afterDelete = await client.query('SELECT data FROM "sessions" WHERE id = $1', [testId]);
    if (afterDelete.rows.length !== 0) {
      throw new Error('Delete failed');
    }
    console.log('  ✓ DELETE operation succeeded (cleaned up test record)');

    client.release();

    console.log('\n[4/4] End-to-End Status: ALL TESTS PASSED!');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n[FAIL] Test encountered error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
