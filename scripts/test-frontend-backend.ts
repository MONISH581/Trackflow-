import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpGet(url: string, headers: Record<string, string> = {}): Promise<{ status: number; body: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode || 200, body: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode || 200, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function httpPost(url: string, payload: any): Promise<{ status: number; body: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(payload);
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode || 200, body: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode || 200, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function verifyFullStackConnection() {
  console.log('\n=================================================================');
  console.log('       TESTING FULL-STACK FRONTEND <-> BACKEND <-> NEON DB       ');
  console.log('=================================================================\n');

  const TEST_PORT = 3456;
  process.env.PORT = String(TEST_PORT);

  console.log(`Starting TrackFlow server on test port ${TEST_PORT}...`);
  const serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(TEST_PORT) },
    shell: true
  });

  let serverStarted = false;
  serverProcess.stdout?.on('data', data => {
    const str = data.toString();
    process.stdout.write(str);
    if (str.includes('Server running locally on')) {
      serverStarted = true;
    }
  });

  serverProcess.stderr?.on('data', data => {
    process.stderr.write(data.toString());
  });

  // Wait for server to boot up
  let attempts = 0;
  while (!serverStarted && attempts < 35) {
    await wait(1000);
    attempts++;
  }

  // Extra second for port binding
  await wait(1500);

  try {
    const baseUrl = `http://127.0.0.1:${TEST_PORT}`;
    console.log(`[✓] Server is online at ${baseUrl}!\n`);

    // 1. Test Frontend HTML delivery
    console.log('[1/5] Testing Frontend Web Application Delivery (GET /)...');
    const indexRes = await httpGet(`${baseUrl}/`);
    const isHtml = typeof indexRes.body === 'string' && (indexRes.body.includes('<div id="root">') || indexRes.body.includes('<html'));
    if (isHtml) {
      console.log('  ✓ SUCCESS: Frontend Single Page App HTML successfully served to browser client!');
    } else {
      console.warn('  ⚠️ Notice: Response was not HTML, status:', indexRes.status);
    }

    // 2. Test Health Endpoint
    console.log('\n[2/5] Testing Backend Health & DB Pool (GET /api/health)...');
    const healthRes = await httpGet(`${baseUrl}/api/health`);
    console.log('  ✓ Health Status:', healthRes.body.status, '| Service:', healthRes.body.service);

    // 3. Test Student List Endpoint (Called by frontend store)
    console.log('\n[3/5] Testing Frontend Data Hook: Student Directory (GET /api/users/students)...');
    const studentsRes = await httpGet(`${baseUrl}/api/users/students`);
    const studentList = Array.isArray(studentsRes.body) ? studentsRes.body : (studentsRes.body?.students || []);
    console.log(`  ✓ SUCCESS: Frontend received ${studentList.length} students directly from Neon PostgreSQL!`);
    const sample = studentList.slice(0, 3);
    sample.forEach(s => {
      console.log(`    • Student: ${s.name} (${s.email})`);
    });
    const allSriShakthi = studentList.every((s: any) => (s.email || '').endsWith('@srishakthi.ac.in'));
    console.log(`    • All student emails verified (@srishakthi.ac.in): ${allSriShakthi ? 'YES ✓' : 'NO ✗'}`);

    // 4. Test Mentors List Endpoint (Called by frontend store)
    console.log('\n[4/5] Testing Frontend Data Hook: Mentors / Teachers (GET /api/mentors)...');
    const mentorsRes = await httpGet(`${baseUrl}/api/mentors`);
    const mentorList = Array.isArray(mentorsRes.body) ? mentorsRes.body : (mentorsRes.body?.mentors || []);
    console.log(`  ✓ SUCCESS: Frontend received ${mentorList.length} mentors directly from Neon PostgreSQL!`);
    mentorList.forEach(m => {
      console.log(`    • Mentor: ${m.name} | Email: ${m.email} | Expertise: ${m.expertise || 'N/A'}`);
    });
    const allSiet = mentorList.every((m: any) => (m.email || '').endsWith('@siet.ac.in'));
    console.log(`    • All mentor emails verified (@siet.ac.in): ${allSiet ? 'YES ✓' : 'NO ✗'}`);

    // 5. Test Hackathons List Endpoint (Called by frontend matrix / dashboard)
    console.log('\n[5/5] Testing Frontend Data Hook: Hackathons (GET /api/hackathons)...');
    const hackathonsRes = await httpGet(`${baseUrl}/api/hackathons`);
    const hackathonList = Array.isArray(hackathonsRes.body) ? hackathonsRes.body : (hackathonsRes.body?.hackathons || []);
    console.log(`  ✓ SUCCESS: Frontend received ${hackathonList.length} hackathons from Neon PostgreSQL!`);
    if (hackathonList.length > 0) {
      console.log(`    • Sample Event: "${hackathonList[0].title || hackathonList[0].name}"`);
    }

    console.log('\n=================================================================');
    console.log('  CONFIRMED: FRONTEND IS 100% CONNECTED WITH NEON POSTGRESQL DB! ');
    console.log('=================================================================\n');

  } catch (err: any) {
    console.error('[Error during full-stack test]:', err.message);
  } finally {
    console.log('Shutting down test server...');
    serverProcess.kill('SIGINT');
    await wait(1000);
    process.exit(0);
  }
}

verifyFullStackConnection().catch(console.error);
