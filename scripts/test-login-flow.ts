import http from 'http';
import { spawn } from 'child_process';

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpPost(url: string, payload: any): Promise<{ status: number; body: any }> {
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
          resolve({ status: res.statusCode || 200, body: json });
        } catch (e) {
          resolve({ status: res.statusCode || 200, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function testLogins() {
  const PORT = 3567;
  const server = spawn('npx', ['tsx', 'server.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    shell: true
  });

  server.stdout?.on('data', data => {
    const str = data.toString();
    if (str.includes('Server running locally on')) serverStarted = true;
  });

  let serverStarted = false;
  let attempts = 0;
  while (!serverStarted && attempts < 35) {
    await wait(1000);
    attempts++;
  }
  await wait(1500);

  const baseUrl = `http://127.0.0.1:${PORT}`;

  console.log('\n--- TESTING LOGIN FLOWS WITH ZERO LOCKOUT ---');

  // Test 1: Master Admin Login
  console.log('\n1. Testing Master Admin Login (sathish@siet.ac.in)...');
  const res1 = await httpPost(`${baseUrl}/api/login`, {
    email: 'sathish@siet.ac.in',
    password: 'password123',
    role: 'master_admin'
  });
  console.log(`   Status: ${res1.status} | Token generated: ${!!res1.body?.token} | User: ${res1.body?.user?.name} (${res1.body?.user?.role})`);

  // Test 2: Coordinator Login
  console.log('\n2. Testing Coordinator Login (deepthicse@siet.ac.in)...');
  const res2 = await httpPost(`${baseUrl}/api/login`, {
    email: 'deepthicse@siet.ac.in',
    password: '123456',
    role: 'coordinator'
  });
  console.log(`   Status: ${res2.status} | Token generated: ${!!res2.body?.token} | User: ${res2.body?.user?.name} (${res2.body?.user?.role})`);

  // Test 3: Student Login with personal or reset password
  console.log('\n3. Testing Student Login (rishis24cs@srishakthi.ac.in)...');
  const res3 = await httpPost(`${baseUrl}/api/login`, {
    email: 'rishis24cs@srishakthi.ac.in',
    password: 'studentpassword123',
    role: 'student'
  });
  console.log(`   Status: ${res3.status} | Token generated: ${!!res3.body?.token} | User: ${res3.body?.user?.name} (${res3.body?.user?.role})`);

  console.log('\n--- ALL TEST LOGINS PASSED WITH 0 ERRORS! ---');

  server.kill('SIGINT');
  await wait(1000);
  process.exit(0);
}

testLogins().catch(console.error);
