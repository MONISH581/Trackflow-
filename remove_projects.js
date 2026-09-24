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

async function run() {
  try {
    const projectsSnapshot = await db.collection('projects').get();
    let deletedCount = 0;
    
    for (const doc of projectsSnapshot.docs) {
      const data = doc.data();
      const name = data.name || '';
      
      if (!name.toLowerCase().includes('trackflow')) {
        await db.collection('projects').doc(doc.id).delete();
        console.log(`Deleted project: ${name} (${doc.id})`);
        deletedCount++;
      } else {
        console.log(`Kept project: ${name} (${doc.id})`);
      }
    }
    
    console.log(`Successfully deleted ${deletedCount} projects.`);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
