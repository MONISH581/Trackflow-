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

async function upsertRecord(client: pg.PoolClient, tableName: string, id: string, doc: any) {
  const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
  const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date();
  const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : new Date();

  // Normalize _id and id
  const cleanDoc = { ...doc, _id: id, id };

  await client.query(
    `INSERT INTO "${safeTable}" (id, data, created_at, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
    [id, JSON.stringify(cleanDoc), createdAt, updatedAt]
  );
}

async function runCompleteMigration() {
  console.log('\n\x1b[36m=================================================================\x1b[0m');
  console.log('\x1b[36m    COMPREHENSIVE MONGODB ATLAS -> NEON POSTGRESQL MIGRATION     \x1b[0m');
  console.log('\x1b[36m=================================================================\x1b[0m\n');

  console.log('Connecting to MongoDB Atlas...');
  const mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  await mongoClient.connect();
  console.log('\x1b[32m[✓] Connected to MongoDB Atlas!\x1b[0m');

  const pgClient = await pool.connect();
  console.log('\x1b[32m[✓] Connected to Neon PostgreSQL!\x1b[0m\n');

  try {
    const memoryStoreUpdate: Record<string, Record<string, any>> = {};

    // 1. Migrate all collections from `trackflow` database
    console.log('\x1b[33m--- [1/3] Migrating "trackflow" Database Collections ---\x1b[0m');
    const tfDb = mongoClient.db('trackflow');
    const tfCols = await tfDb.listCollections().toArray();

    for (const colInfo of tfCols) {
      const colName = colInfo.name;
      // Skip internal test collections
      if (colName.startsWith('systemhealth')) continue;

      await ensureTable(pgClient, colName);
      const docs = await tfDb.collection(colName).find().toArray();
      
      memoryStoreUpdate[colName] = memoryStoreUpdate[colName] || {};

      let count = 0;
      for (const rawDoc of docs) {
        const id = String(rawDoc._id || rawDoc.id);
        const docObj = { ...rawDoc };
        delete (docObj as any).__v;
        
        await upsertRecord(pgClient, colName, id, docObj);
        memoryStoreUpdate[colName][id] = docObj;
        count++;
      }
      console.log(`  ✓ \x1b[32m${colName.padEnd(25)}\x1b[0m: ${count} records migrated`);
    }

    // 2. Migrate students and teachers from `attendence` database
    console.log('\n\x1b[33m--- [2/3] Migrating "attendence" Database (Students & Teachers) ---\x1b[0m');
    const attDb = mongoClient.db('attendence');

    // A. Students Table & User Integration
    await ensureTable(pgClient, 'students');
    await ensureTable(pgClient, 'users');
    memoryStoreUpdate['students'] = memoryStoreUpdate['students'] || {};
    memoryStoreUpdate['users'] = memoryStoreUpdate['users'] || {};

    const rawStudents = await attDb.collection('students').find().toArray();
    let studentsMigrated = 0;

    for (const student of rawStudents) {
      const id = String(student._id);
      const cleanStudent = { ...student };
      delete (cleanStudent as any).__v;

      // 1. Save into 'students' table
      await upsertRecord(pgClient, 'students', id, cleanStudent);
      memoryStoreUpdate['students'][id] = cleanStudent;
      studentsMigrated++;

      // 2. Ensure student is also in 'users' collection so they appear across student lists
      const studentUser = {
        _id: id,
        id: id,
        userId: student.rollNo ? student.rollNo.toLowerCase() : `student_${id}`,
        name: student.name,
        rollNo: student.rollNo,
        className: student.className,
        department: student.department || (student.className ? student.className.split('-')[0] : 'Engineering'),
        role: 'student',
        status: 'approved',
        accountStatus: 'ACTIVE',
        attendanceRecords: student.attendance || [],
        createdAt: student.createdAt || new Date(),
        updatedAt: student.updatedAt || new Date()
      };
      await upsertRecord(pgClient, 'users', id, studentUser);
      memoryStoreUpdate['users'][id] = studentUser;
    }
    console.log(`  ✓ \x1b[32m${'students'.padEnd(25)}\x1b[0m: ${studentsMigrated} student records migrated and added to users`);

    // B. Teachers Table & Mentor Integration
    await ensureTable(pgClient, 'teachers');
    await ensureTable(pgClient, 'mentors');
    memoryStoreUpdate['teachers'] = memoryStoreUpdate['teachers'] || {};
    memoryStoreUpdate['mentors'] = memoryStoreUpdate['mentors'] || {};

    const rawTeachers = await attDb.collection('teachers').find().toArray();
    let teachersMigrated = 0;

    for (const teacher of rawTeachers) {
      const id = String(teacher._id);
      const cleanTeacher = { ...teacher };
      delete (cleanTeacher as any).__v;

      // 1. Save into 'teachers' table
      await upsertRecord(pgClient, 'teachers', id, cleanTeacher);
      memoryStoreUpdate['teachers'][id] = cleanTeacher;
      teachersMigrated++;

      // 2. Ensure teacher is in 'mentors' table
      const mentorDoc = {
        _id: id,
        id: id,
        name: teacher.name,
        email: teacher.email,
        role: 'mentor',
        department: teacher.department || 'Faculty',
        createdAt: teacher.createdAt || new Date(),
        updatedAt: teacher.updatedAt || new Date()
      };
      await upsertRecord(pgClient, 'mentors', id, mentorDoc);
      memoryStoreUpdate['mentors'][id] = mentorDoc;

      // 3. Ensure teacher is in 'users' table
      const teacherUser = {
        _id: id,
        id: id,
        userId: teacher.email ? teacher.email.split('@')[0] : `mentor_${id}`,
        name: teacher.name,
        email: teacher.email,
        role: 'mentor',
        department: teacher.department || 'Faculty',
        status: 'approved',
        accountStatus: 'ACTIVE',
        createdAt: teacher.createdAt || new Date(),
        updatedAt: teacher.updatedAt || new Date()
      };
      await upsertRecord(pgClient, 'users', id, teacherUser);
      memoryStoreUpdate['users'][id] = teacherUser;
    }
    console.log(`  ✓ \x1b[32m${'teachers'.padEnd(25)}\x1b[0m: ${teachersMigrated} teacher records migrated and added to mentors/users`);

    // 3. Sync into uploads/db_store.json so local store is also complete
    console.log('\n\x1b[33m--- [3/3] Synchronizing Local Store Backup (uploads/db_store.json) ---\x1b[0m');
    const dbFilePath = path.join(process.cwd(), 'uploads', 'db_store.json');
    let existingDisk: Record<string, Record<string, any>> = {};
    if (fs.existsSync(dbFilePath)) {
      try {
        existingDisk = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
      } catch (e) {}
    }

    for (const [col, docs] of Object.entries(memoryStoreUpdate)) {
      existingDisk[col] = existingDisk[col] || {};
      for (const [docId, docVal] of Object.entries(docs)) {
        existingDisk[col][docId] = docVal;
      }
    }

    fs.writeFileSync(dbFilePath, JSON.stringify(existingDisk, null, 2), 'utf8');
    console.log('  ✓ Updated uploads/db_store.json with all migrated MongoDB data.');

    // Print Final Verified Totals in PostgreSQL
    console.log('\n\x1b[36m=================================================================\x1b[0m');
    console.log('\x1b[36m         VERIFIED TOTALS IN NEON POSTGRESQL DATABASE             \x1b[0m');
    console.log('\x1b[36m=================================================================\x1b[0m\n');

    const checkTables = [
      'users', 'students', 'teachers', 'mentors', 'projects', 'hackathons',
      'opportunities', 'attendances', 'lab_accesses', 'notifications',
      'activity_logs', 'sessions', 'messages', 'hackathon_registrations', 'hackathon_interests'
    ];

    let grandTotal = 0;
    for (const t of checkTables) {
      try {
        const res = await pgClient.query(`SELECT COUNT(*) AS count FROM "${t}"`);
        const c = parseInt(res.rows[0].count, 10);
        grandTotal += c;
        console.log(`  • \x1b[32m${t.padEnd(25)}\x1b[0m: \x1b[1m${c} records\x1b[0m`);
      } catch (e) {}
    }

    console.log(`\n  \x1b[1mGrand Total in Neon PostgreSQL:\x1b[0m \x1b[32m${grandTotal} records\x1b[0m`);
    console.log('\n\x1b[32m[SUCCESS] Complete migration from MongoDB to Neon finished!\x1b[0m\n');

  } catch (err: any) {
    console.error('\x1b[31m[Migration Error]:\x1b[0m', err.message);
  } finally {
    pgClient.release();
    await pool.end();
    await mongoClient.close();
  }
}

runCompleteMigration();
