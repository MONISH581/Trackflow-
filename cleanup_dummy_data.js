import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  })
});

const db = getFirestore();

// Helper: delete all docs in a collection
async function deleteAllInCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`  [${collectionName}] Already empty.`);
    return 0;
  }
  let count = 0;
  for (const doc of snapshot.docs) {
    await db.collection(collectionName).doc(doc.id).delete();
    count++;
  }
  console.log(`  [${collectionName}] Deleted ${count} documents.`);
  return count;
}

// Helper: list all docs in a collection (for inspection)
async function listCollection(collectionName, fields = []) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`  [${collectionName}] Empty.`);
    return [];
  }
  const docs = [];
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const summary = { id: doc.id };
    if (fields.length > 0) {
      fields.forEach(f => summary[f] = data[f] || '');
    }
    docs.push(summary);
  });
  return docs;
}

async function run() {
  try {
    console.log('\n========================================');
    console.log('  TrackFlow - Dummy Data Cleanup Script');
    console.log('========================================\n');

    let totalDeleted = 0;

    // 1. MENTORS - Remove all dummy mentors
    console.log('--- MENTORS ---');
    const mentors = await listCollection('mentors', ['name', 'email', 'expertise', 'status']);
    if (mentors.length > 0) {
      console.log('  Found mentors:');
      mentors.forEach(m => console.log(`    - ${m.name} (${m.email}) [${m.status}]`));
      // Delete all dummy mentors (non-real ones)
      const mentorSnapshot = await db.collection('mentors').get();
      let mentorDeleted = 0;
      for (const doc of mentorSnapshot.docs) {
        const data = doc.data();
        const name = (data.name || '').toLowerCase();
        // Keep only if it's a clearly real mentor; delete test/dummy ones
        const isDummy = name.includes('demo') || name.includes('test') || name.includes('dummy') || 
                        name.includes('sample') || name.includes('abc') || name.includes('john doe') ||
                        name.includes('jane') || name.includes('placeholder');
        if (isDummy) {
          await db.collection('mentors').doc(doc.id).delete();
          console.log(`  ✗ Deleted dummy mentor: ${data.name}`);
          mentorDeleted++;
        } else {
          console.log(`  ✓ Kept mentor: ${data.name}`);
        }
      }
      totalDeleted += mentorDeleted;
    } else {
      console.log('  No mentors found.');
    }

    // 2. TASKS - Remove dummy/test tasks
    console.log('\n--- TASKS ---');
    const taskSnapshot = await db.collection('tasks').get();
    if (!taskSnapshot.empty) {
      let taskDeleted = 0;
      for (const doc of taskSnapshot.docs) {
        const data = doc.data();
        const title = (data.title || '').toLowerCase();
        const isDummy = title.includes('demo') || title.includes('test') || title.includes('dummy') ||
                        title.includes('sample') || title.includes('abc') || title.includes('placeholder');
        if (isDummy) {
          await db.collection('tasks').doc(doc.id).delete();
          console.log(`  ✗ Deleted dummy task: ${data.title}`);
          taskDeleted++;
        } else {
          console.log(`  ✓ Kept task: ${data.title}`);
        }
      }
      totalDeleted += taskDeleted;
    } else {
      console.log('  No tasks found.');
    }

    // 3. DAILY_REPORTS - Remove reports linked to non-TrackFlow projects
    console.log('\n--- DAILY REPORTS ---');
    // Get real project IDs first
    const projectSnapshot = await db.collection('projects').get();
    const realProjectIds = new Set();
    projectSnapshot.docs.forEach(doc => {
      realProjectIds.add(doc.id);
    });
    console.log(`  Real project IDs: ${[...realProjectIds].join(', ')}`);

    const reportSnapshot = await db.collection('daily_reports').get();
    if (!reportSnapshot.empty) {
      let reportDeleted = 0;
      for (const doc of reportSnapshot.docs) {
        const data = doc.data();
        if (data.projectId && !realProjectIds.has(data.projectId)) {
          await db.collection('daily_reports').doc(doc.id).delete();
          console.log(`  ✗ Deleted orphan report for project: ${data.projectId}`);
          reportDeleted++;
        } else {
          console.log(`  ✓ Kept report: ${doc.id} (project: ${data.projectId})`);
        }
      }
      totalDeleted += reportDeleted;
    } else {
      console.log('  No daily reports found.');
    }

    // 4. MESSAGES - Remove test/dummy messages
    console.log('\n--- MESSAGES ---');
    const msgSnapshot = await db.collection('messages').get();
    if (!msgSnapshot.empty) {
      let msgDeleted = 0;
      for (const doc of msgSnapshot.docs) {
        const data = doc.data();
        const text = (data.text || '').toLowerCase();
        if (data.projectId && !realProjectIds.has(data.projectId)) {
          await db.collection('messages').doc(doc.id).delete();
          msgDeleted++;
        }
      }
      if (msgDeleted > 0) console.log(`  ✗ Deleted ${msgDeleted} orphan messages.`);
      else console.log(`  ✓ No orphan messages found.`);
      totalDeleted += msgDeleted;
    } else {
      console.log('  No messages found.');
    }

    // 5. NOTIFICATIONS - Remove old/test notifications
    console.log('\n--- NOTIFICATIONS ---');
    const notifSnapshot = await db.collection('notifications').get();
    if (!notifSnapshot.empty) {
      let notifDeleted = 0;
      for (const doc of notifSnapshot.docs) {
        const data = doc.data();
        const title = (data.title || '').toLowerCase();
        const isDummy = title.includes('demo') || title.includes('test') || title.includes('dummy') ||
                        title.includes('sample');
        if (isDummy) {
          await db.collection('notifications').doc(doc.id).delete();
          notifDeleted++;
        }
      }
      if (notifDeleted > 0) console.log(`  ✗ Deleted ${notifDeleted} dummy notifications.`);
      else console.log(`  ✓ No dummy notifications found. (${notifSnapshot.size} total kept)`);
      totalDeleted += notifDeleted;
    } else {
      console.log('  No notifications found.');
    }

    // 6. SESSIONS - Clean up old/expired sessions
    console.log('\n--- SESSIONS ---');
    const sessionCount = await deleteAllInCollection('sessions');
    totalDeleted += sessionCount;

    // 7. ABSTRACT_HISTORIES - Remove orphan entries
    console.log('\n--- ABSTRACT HISTORIES ---');
    const absSnapshot = await db.collection('abstract_histories').get();
    if (!absSnapshot.empty) {
      let absDeleted = 0;
      for (const doc of absSnapshot.docs) {
        const data = doc.data();
        if (data.projectId && !realProjectIds.has(data.projectId)) {
          await db.collection('abstract_histories').doc(doc.id).delete();
          absDeleted++;
        }
      }
      if (absDeleted > 0) console.log(`  ✗ Deleted ${absDeleted} orphan abstract history entries.`);
      else console.log(`  ✓ No orphan abstract histories. (${absSnapshot.size} total kept)`);
      totalDeleted += absDeleted;
    } else {
      console.log('  No abstract histories found.');
    }

    // 8. MILESTONE_PRESENTATIONS - Remove orphan entries
    console.log('\n--- MILESTONE PRESENTATIONS ---');
    const msSnapshot = await db.collection('milestone_presentations').get();
    if (!msSnapshot.empty) {
      let msDeleted = 0;
      for (const doc of msSnapshot.docs) {
        const data = doc.data();
        if (data.projectId && !realProjectIds.has(data.projectId)) {
          await db.collection('milestone_presentations').doc(doc.id).delete();
          msDeleted++;
        }
      }
      if (msDeleted > 0) console.log(`  ✗ Deleted ${msDeleted} orphan milestone presentations.`);
      else console.log(`  ✓ No orphan milestone presentations. (${msSnapshot.size} total kept)`);
      totalDeleted += msDeleted;
    } else {
      console.log('  No milestone presentations found.');
    }

    // 9. PROJECT_EXTENSIONS - Remove orphan entries
    console.log('\n--- PROJECT EXTENSIONS ---');
    const extSnapshot = await db.collection('project_extensions').get();
    if (!extSnapshot.empty) {
      let extDeleted = 0;
      for (const doc of extSnapshot.docs) {
        const data = doc.data();
        if (data.projectId && !realProjectIds.has(data.projectId)) {
          await db.collection('project_extensions').doc(doc.id).delete();
          extDeleted++;
        }
      }
      if (extDeleted > 0) console.log(`  ✗ Deleted ${extDeleted} orphan project extensions.`);
      else console.log(`  ✓ No orphan project extensions. (${extSnapshot.size} total kept)`);
      totalDeleted += extDeleted;
    } else {
      console.log('  No project extensions found.');
    }

    // 10. GITHUB_REPOS - Remove orphan entries
    console.log('\n--- GITHUB REPOS ---');
    const ghSnapshot = await db.collection('github_repos').get();
    if (!ghSnapshot.empty) {
      let ghDeleted = 0;
      for (const doc of ghSnapshot.docs) {
        const data = doc.data();
        if (data.projectId && !realProjectIds.has(data.projectId)) {
          await db.collection('github_repos').doc(doc.id).delete();
          ghDeleted++;
        }
      }
      if (ghDeleted > 0) console.log(`  ✗ Deleted ${ghDeleted} orphan github repo entries.`);
      else console.log(`  ✓ No orphan github repo entries. (${ghSnapshot.size} total kept)`);
      totalDeleted += ghDeleted;
    } else {
      console.log('  No github repo entries found.');
    }

    // 11. ACTIVITY_LOGS - Clean up test logs
    console.log('\n--- ACTIVITY LOGS ---');
    const logSnapshot = await db.collection('activity_logs').get();
    if (!logSnapshot.empty) {
      console.log(`  Found ${logSnapshot.size} activity logs. Cleaning all...`);
      totalDeleted += await deleteAllInCollection('activity_logs');
    } else {
      console.log('  No activity logs found.');
    }

    // 12. LAB_ACCESSES - Clean up expired/test entries
    console.log('\n--- LAB ACCESSES ---');
    const labSnapshot = await db.collection('lab_accesses').get();
    if (!labSnapshot.empty) {
      let labDeleted = 0;
      for (const doc of labSnapshot.docs) {
        const data = doc.data();
        // Remove entries where checkout already happened or test entries
        if (data.checkOutTime) {
          await db.collection('lab_accesses').doc(doc.id).delete();
          labDeleted++;
        }
      }
      if (labDeleted > 0) console.log(`  ✗ Cleaned ${labDeleted} completed lab access records.`);
      else console.log(`  ✓ No completed lab access records to clean. (${labSnapshot.size} active)`);
      totalDeleted += labDeleted;
    } else {
      console.log('  No lab access records found.');
    }

    console.log('\n========================================');
    console.log(`  ✅ CLEANUP COMPLETE: ${totalDeleted} dummy/orphan documents removed.`);
    console.log('========================================\n');

  } catch (err) {
    console.error('Error during cleanup:', err);
  }
}

run();
