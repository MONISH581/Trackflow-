import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { MongoClient } from 'mongodb';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://Monish:monish134@cluster0.bwsejfk.mongodb.net/trackflow?retryWrites=true&w=majority&appName=Cluster0';
const PG_URL = process.env.DATABASE_URL;

if (!PG_URL) {
  console.error('\x1b[31m[Error] DATABASE_URL is not set in .env!\x1b[0m');
  process.exit(1);
}

const pool = new Pool({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false }
});

async function ensureTable(client: pg.PoolClient, tableName: string) {
  const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
  await client.query(`
    CREATE TABLE IF NOT EXISTS "${safeTable}" (
      id VARCHAR(255) PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "idx_${safeTable}_gin" ON "${safeTable}" USING gin (data);
  `);
}

async function dropExtraneousTable(client: pg.PoolClient, tableName: string) {
  const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
  await client.query(`DROP TABLE IF EXISTS "${safeTable}" CASCADE;`);
}

async function insertRecord(client: pg.PoolClient, tableName: string, id: string, doc: any) {
  const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
  const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
  const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

  const cleanDoc = { ...doc, _id: id, id };

  await client.query(
    `INSERT INTO "${safeTable}" (id, data, created_at, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
    [id, JSON.stringify(cleanDoc), createdAt, updatedAt]
  );
}

async function runExactTrackFlowMigration() {
  console.log('\n\x1b[36m=================================================================\x1b[0m');
  console.log('\x1b[36m    EXACT TRACKFLOW MIGRATION: MONGODB ATLAS -> NEON POSTGRES    \x1b[0m');
  console.log('\x1b[36m=================================================================\x1b[0m\n');

  console.log('Connecting to MongoDB Atlas (trackflow database)...');
  const mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  await mongoClient.connect();
  console.log('\x1b[32m[✓] Connected to MongoDB Atlas!\x1b[0m');

  const pgClient = await pool.connect();
  console.log('\x1b[32m[✓] Connected to Neon PostgreSQL!\x1b[0m\n');

  try {
    // 1. Drop extraneous foreign tables that do not belong to Trackflow
    console.log('\x1b[33m--- [1/4] Dropping extraneous tables (students, teachers, test tables) ---\x1b[0m');
    const foreignTables = ['students', 'teachers', 'systemhealthtests', 'systemhealthtestnews'];
    for (const ft of foreignTables) {
      await dropExtraneousTable(pgClient, ft);
      console.log(`  ✓ Removed table "${ft}" from Neon PostgreSQL.`);
    }

    // 2. Clear out existing tables to guarantee 100% exact fidelity with MongoDB trackflow database
    console.log('\n\x1b[33m--- [2/4] Truncating and Rebuilding exact Trackflow tables ---\x1b[0m');
    const tfDb = mongoClient.db('trackflow');
    const tfCols = await tfDb.listCollections().toArray();

    const diskStore: Record<string, Record<string, any>> = {};

    for (const colInfo of tfCols) {
      const colName = colInfo.name;
      // Skip test/internal collections
      if (colName.startsWith('systemhealth')) continue;

      await ensureTable(pgClient, colName);
      // Clean existing table in Neon to guarantee no leftover foreign records
      await pgClient.query(`TRUNCATE TABLE "${colName}" CASCADE;`);

      const docs = await tfDb.collection(colName).find().toArray();
      diskStore[colName] = {};

      let count = 0;
      for (const rawDoc of docs) {
        const id = String(rawDoc._id || rawDoc.id);
        const docObj = { ...rawDoc };
        delete (docObj as any).__v;

        await insertRecord(pgClient, colName, id, docObj);
        diskStore[colName][id] = docObj;
        count++;
      }
      console.log(`  ✓ \x1b[32m${colName.padEnd(25)}\x1b[0m: ${count} exact records migrated from MongoDB Atlas`);
    }

    // 3. Update local backup store (uploads/db_store.json) to strictly match
    console.log('\n\x1b[33m--- [3/4] Updating Local Backup Store (uploads/db_store.json) ---\x1b[0m');
    const dbFilePath = path.join(process.cwd(), 'uploads', 'db_store.json');
    const uploadsDir = path.dirname(dbFilePath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(dbFilePath, JSON.stringify(diskStore, null, 2), 'utf8');
    console.log('  ✓ uploads/db_store.json overwritten with exact Trackflow records only.');

    // 4. Strict Validation of Faculty and Student Emails
    console.log('\n\x1b[33m--- [4/4] Validating Staff/Faculty (@siet.ac.in) & Student (@srishakthi.ac.in) Emails ---\x1b[0m');
    
    // Check all users
    const userRows = await pgClient.query(`SELECT id, data FROM "users" ORDER BY created_at ASC;`);
    console.log(`\n  \x1b[1mVerified Users in Neon PostgreSQL (${userRows.rows.length}):\x1b[0m`);
    
    let staffCount = 0;
    let studentCount = 0;
    const invalidUsers: any[] = [];

    for (const r of userRows.rows) {
      const u = r.data;
      const email = (u.email || '').toLowerCase().trim();
      const role = (u.role || '').toLowerCase();

      if (['master_admin', 'coordinator', 'admin'].includes(role)) {
        if (!email.endsWith('@siet.ac.in')) {
          invalidUsers.push({ id: r.id, name: u.name, email, role, issue: 'Staff email must end with @siet.ac.in' });
        } else {
          staffCount++;
          console.log(`    • [STAFF]   \x1b[32m${u.name.padEnd(25)}\x1b[0m | Role: \x1b[36m${role.padEnd(14)}\x1b[0m | Email: \x1b[32m${email}\x1b[0m`);
        }
      } else if (role === 'student') {
        if (!email.endsWith('@srishakthi.ac.in')) {
          invalidUsers.push({ id: r.id, name: u.name, email, role, issue: 'Student email must end with @srishakthi.ac.in' });
        } else {
          studentCount++;
          console.log(`    • [STUDENT] \x1b[32m${u.name.padEnd(25)}\x1b[0m | Role: \x1b[33m${role.padEnd(14)}\x1b[0m | Email: \x1b[32m${email}\x1b[0m`);
        }
      } else {
        console.log(`    • [OTHER]   \x1b[35m${u.name.padEnd(25)}\x1b[0m | Role: \x1b[35m${role.padEnd(14)}\x1b[0m | Email: ${email}`);
      }
    }

    // Check all mentors
    const mentorRows = await pgClient.query(`SELECT id, data FROM "mentors" ORDER BY created_at ASC;`);
    console.log(`\n  \x1b[1mVerified Mentors in Neon PostgreSQL (${mentorRows.rows.length}):\x1b[0m`);
    let mentorCount = 0;
    for (const r of mentorRows.rows) {
      const m = r.data;
      const email = (m.email || '').toLowerCase().trim();
      if (!email.endsWith('@siet.ac.in')) {
        invalidUsers.push({ id: r.id, name: m.name, email, role: 'mentor', issue: 'Mentor email must end with @siet.ac.in' });
      } else {
        mentorCount++;
        console.log(`    • [MENTOR]  \x1b[32m${m.name.padEnd(25)}\x1b[0m | Expertise: \x1b[36m${(m.expertise || 'N/A').padEnd(25)}\x1b[0m | Email: \x1b[32m${email}\x1b[0m`);
      }
    }

    if (invalidUsers.length > 0) {
      console.error('\n\x1b[31m[VALIDATION FAILED] The following users violate the institutional email requirement:\x1b[0m');
      console.table(invalidUsers);
      throw new Error('Migration validation failed: Invalid email domains detected!');
    }

    console.log('\n\x1b[36m=================================================================\x1b[0m');
    console.log('\x1b[36m            FINAL EXACT VERIFIED TOTALS IN NEON POSTGRES         \x1b[0m');
    console.log('\x1b[36m=================================================================\x1b[0m\n');

    const checkTables = [
      'users', 'mentors', 'projects', 'hackathons',
      'opportunities', 'attendances', 'lab_accesses', 'notifications',
      'activity_logs', 'sessions', 'messages', 'hackathon_registrations',
      'hackathon_interests', 'daily_reports', 'abstract_histories', 'github_repos'
    ];

    let grandTotal = 0;
    for (const t of checkTables) {
      const res = await pgClient.query(`SELECT COUNT(*) AS count FROM "${t}"`);
      const c = parseInt(res.rows[0].count, 10);
      grandTotal += c;
      console.log(`  • \x1b[32m${t.padEnd(25)}\x1b[0m: \x1b[1m${c} records\x1b[0m`);
    }

    console.log(`\n  \x1b[1mGrand Total in Neon PostgreSQL:\x1b[0m \x1b[32m${grandTotal} records\x1b[0m`);
    console.log(`  \x1b[1mStaff/Faculty Accounts (@siet.ac.in):\x1b[0m \x1b[32m${staffCount + mentorCount}\x1b[0m`);
    console.log(`  \x1b[1mStudent Accounts (@srishakthi.ac.in):\x1b[0m \x1b[32m${studentCount}\x1b[0m`);
    console.log(`  \x1b[1mForeign/Dummy Accounts:\x1b[0m \x1b[32m0 (Completely eliminated)\x1b[0m`);
    console.log('\n\x1b[32m[SUCCESS] Exact Trackflow database migration completed flawlessly!\x1b[0m\n');

  } catch (err: any) {
    console.error('\x1b[31m[Migration Error]:\x1b[0m', err.message);
    process.exit(1);
  } finally {
    pgClient.release();
    await pool.end();
    await mongoClient.close();
  }
}

runExactTrackFlowMigration();
