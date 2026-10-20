import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pgConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PG_URL;

if (!pgConnectionString && !process.env.PGHOST) {
  console.error('\x1b[31m[Error] No PostgreSQL connection string found!\x1b[0m');
  console.log('Please set DATABASE_URL or POSTGRES_URL in your .env file.');
  console.log('Example: DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"');
  process.exit(1);
}

const isLocalhost = pgConnectionString
  ? (pgConnectionString.includes('localhost') || pgConnectionString.includes('127.0.0.1'))
  : (process.env.PGHOST === 'localhost' || process.env.PGHOST === '127.0.0.1');

const pool = new Pool(
  pgConnectionString
    ? {
        connectionString: pgConnectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      }
);

const ALL_COLLECTIONS = [
  'users', 'mentors', 'projects', 'github_repos', 'tasks', 'notifications',
  'messages', 'daily_reports', 'hackathons', 'hackathon_registrations',
  'hackathon_mappings', 'hackathon_interests', 'abstract_histories', 'attendances',
  'lab_accesses', 'opportunities', 'activity_logs', 'milestone_presentations',
  'project_extensions', 'sessions'
];

async function runMigration() {
  console.log('\n\x1b[36m========================================================\x1b[0m');
  console.log('\x1b[36m        TrackFlow PostgreSQL Migration & Setup Tool     \x1b[0m');
  console.log('\x1b[36m========================================================\x1b[0m\n');

  try {
    const client = await pool.connect();
    console.log('\x1b[32m[+] Connected successfully to PostgreSQL database!\x1b[0m');
    client.release();

    console.log('\n[1/3] Initializing tables and GIN indices...');
    for (const col of ALL_COLLECTIONS) {
      const safeTable = col.replace(/[^a-zA-Z0-9_]/g, '_');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${safeTable}" (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS "idx_${safeTable}_gin" ON "${safeTable}" USING gin (data);
      `);
    }
    console.log('\x1b[32m[+] All 20 tables and GIN indices verified.\x1b[0m');

    console.log('\n[2/3] Checking for existing data in uploads/db_store.json...');
    const dbFilePath = path.join(process.cwd(), 'uploads', 'db_store.json');
    if (!fs.existsSync(dbFilePath)) {
      console.log('\x1b[33m[!] No uploads/db_store.json found. Database tables are ready for new records.\x1b[0m');
      await pool.end();
      return;
    }

    const raw = fs.readFileSync(dbFilePath, 'utf8');
    const store = JSON.parse(raw);

    console.log('\n[3/3] Migrating collection records to PostgreSQL...');
    let totalMigrated = 0;
    for (const [colName, docs] of Object.entries(store)) {
      const safeTable = colName.replace(/[^a-zA-Z0-9_]/g, '_');
      const docEntries = Object.entries(docs as Record<string, any>);
      if (docEntries.length === 0) continue;

      let colCount = 0;
      for (const [docId, docVal] of docEntries) {
        const id = String(docVal._id || docVal.id || docId);
        const createdAt = docVal.createdAt ? new Date(docVal.createdAt) : new Date();
        const updatedAt = docVal.updatedAt ? new Date(docVal.updatedAt) : new Date();

        await pool.query(
          `INSERT INTO "${safeTable}" (id, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
          [id, JSON.stringify(docVal), createdAt, updatedAt]
        );
        colCount++;
        totalMigrated++;
      }
      console.log(`  - \x1b[32m${colName.padEnd(25)}\x1b[0m: ${colCount} records migrated`);
    }

    console.log(`\n\x1b[32m[SUCCESS] Migration finished! Total records migrated: ${totalMigrated}\x1b[0m\n`);
  } catch (err: any) {
    console.error('\x1b[31m[Migration Failed]:\x1b[0m', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
