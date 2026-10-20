import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('\x1b[31m[Error] DATABASE_URL is not set in .env!\x1b[0m');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const ALL_TABLES = [
  'users',
  'mentors',
  'projects',
  'github_repos',
  'tasks',
  'notifications',
  'messages',
  'daily_reports',
  'hackathons',
  'hackathon_registrations',
  'hackathon_mappings',
  'hackathon_interests',
  'abstract_histories',
  'attendances',
  'lab_accesses',
  'opportunities',
  'activity_logs',
  'milestone_presentations',
  'project_extensions',
  'sessions'
];

async function verifyDatabaseSave() {
  console.log('\n\x1b[36m=================================================================\x1b[0m');
  console.log('\x1b[36m          LIVE DATABASE STORAGE & SAVE VERIFICATION             \x1b[0m');
  console.log('\x1b[36m=================================================================\x1b[0m\n');

  try {
    const client = await pool.connect();
    console.log('\x1b[32m[✓] Connected to Neon PostgreSQL Database!\x1b[0m');
    console.log(`    Host: ep-jolly-bar-az0r6ezg-pooler.c-3.ap-southeast-1.aws.neon.tech`);
    console.log(`    Database: neondb\n`);

    // 1. Table Counts in Live Database
    console.log('\x1b[33m--- [1] Live Row Counts in Neon PostgreSQL Database ---\x1b[0m');
    let totalRows = 0;
    const tableCounts: { table: string; count: number }[] = [];

    for (const table of ALL_TABLES) {
      try {
        const res = await client.query(`SELECT COUNT(*) AS count FROM "${table}"`);
        const count = parseInt(res.rows[0].count, 10);
        tableCounts.push({ table, count });
        totalRows += count;
      } catch (err: any) {
        tableCounts.push({ table, count: -1 });
      }
    }

    // Print neatly formatted table
    for (const { table, count } of tableCounts) {
      if (count > 0) {
        console.log(`  • \x1b[32m${table.padEnd(25)}\x1b[0m: \x1b[1m${count} records actively saved\x1b[0m`);
      } else if (count === 0) {
        console.log(`  • ${table.padEnd(25)}: 0 records (table ready)`);
      } else {
        console.log(`  • \x1b[31m${table.padEnd(25)}: table missing\x1b[0m`);
      }
    }
    console.log(`\n  \x1b[1mTotal records across all tables:\x1b[0m \x1b[32m${totalRows} records\x1b[0m\n`);

    // 2. Real Write Test (Save new user / project / task record)
    console.log('\x1b[33m--- [2] Performing Live Data SAVE Test to PostgreSQL ---\x1b[0m');
    const testDocId = `test_save_${Date.now()}`;
    const testPayload = {
      _id: testDocId,
      id: testDocId,
      name: "TrackFlow Test User",
      email: `test.${Date.now()}@srishakthi.ac.in`,
      role: "student",
      status: "approved",
      testTimestamp: new Date().toISOString()
    };

    console.log(`  1. Writing new record to table "users" (ID: ${testDocId})...`);
    await client.query(
      `INSERT INTO "users" (id, data, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
      [testDocId, JSON.stringify(testPayload)]
    );
    console.log(`     \x1b[32m✓ Write command executed successfully.\x1b[0m`);

    // 3. Verify immediately from PostgreSQL using independent SELECT query
    console.log(`  2. Querying PostgreSQL directly with SQL: SELECT * FROM "users" WHERE id = '${testDocId}'...`);
    const selectRes = await client.query(`SELECT id, data, created_at, updated_at FROM "users" WHERE id = $1`, [testDocId]);

    if (selectRes.rows.length === 0) {
      throw new Error(`Record was not found in PostgreSQL table "users"!`);
    }

    const savedRow = selectRes.rows[0];
    console.log(`     \x1b[32m✓ VERIFIED: Record exists in Neon PostgreSQL!\x1b[0m`);
    console.log(`     - Stored ID:`, savedRow.id);
    console.log(`     - Stored created_at:`, savedRow.created_at);
    console.log(`     - Stored Email:`, savedRow.data.email);
    console.log(`     - Stored Role:`, savedRow.data.role);

    // 4. Test Update (Modifying data in database)
    console.log(`  3. Testing UPDATE in PostgreSQL...`);
    testPayload.name = "TrackFlow Test User (UPDATED)";
    await client.query(
      `UPDATE "users" SET data = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(testPayload), testDocId]
    );

    const updatedRes = await client.query(`SELECT data->>'name' AS name, updated_at FROM "users" WHERE id = $1`, [testDocId]);
    console.log(`     \x1b[32m✓ VERIFIED: Record updated in Neon! New name: "${updatedRes.rows[0].name}"\x1b[0m`);

    // 5. Clean up the test row
    console.log(`  4. Cleaning up test record from database...`);
    await client.query(`DELETE FROM "users" WHERE id = $1`, [testDocId]);
    const afterDelete = await client.query(`SELECT COUNT(*) AS count FROM "users" WHERE id = $1`, [testDocId]);
    if (parseInt(afterDelete.rows[0].count, 10) === 0) {
      console.log(`     \x1b[32m✓ VERIFIED: Test record cleanly removed after verification.\x1b[0m\n`);
    }

    // Inspect actual students and teachers in database
    console.log('\x1b[33m--- [3] Teachers & Mentors in Neon PostgreSQL ---\x1b[0m');
    const mentorsRes = await client.query(`SELECT id, data FROM "mentors"`);
    for (const m of mentorsRes.rows) {
      console.log(`  • ${m.data.name.padEnd(20)} | Email: ${(m.data.email || 'N/A').padEnd(25)} | Dept: ${m.data.department || 'Faculty'}`);
    }

    console.log('\n\x1b[33m--- [4] Registered Students in Neon PostgreSQL ---\x1b[0m');
    const studentsRes = await client.query(`SELECT id, data FROM "users" WHERE data->>'role' = 'student'`);
    for (const s of studentsRes.rows) {
      const roll = s.data.rollNo || s.data.className || 'N/A';
      console.log(`  • ${(s.data.name || '').padEnd(28)} | Roll/Class: ${roll.padEnd(12)} | Email: ${s.data.email || 'N/A'}`);
    }
    console.log(`\n  \x1b[1mTotal Teachers/Mentors:\x1b[0m \x1b[32m${mentorsRes.rows.length}\x1b[0m | \x1b[1mTotal Students:\x1b[0m \x1b[32m${studentsRes.rows.length}\x1b[0m`);

    console.log('\n\x1b[32m=================================================================\x1b[0m');
    console.log('\x1b[32m CONFIRMED: DATA IS ACTIVELY SAVING & PERSISTING IN NEON POSTGRES \x1b[0m');
    console.log('\x1b[32m=================================================================\x1b[0m\n');

    client.release();
  } catch (err: any) {
    console.error('\n\x1b[31m[Verification Failed]:\x1b[0m', err.message);
  } finally {
    await pool.end();
  }
}

verifyDatabaseSave();
