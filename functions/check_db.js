const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
  projectId: 'lambolimos'
});

const db = getFirestore(admin.app(), 'procfin');

async function run() {
  try {
    console.log('Querying users in procfin database...');
    const snapshot = await db.collection('users').get();
    if (snapshot.empty) {
      console.log('No users found in procfin database.');
    } else {
      snapshot.forEach(doc => {
        console.log(`User ID: ${doc.id}`);
        console.log('Data:', doc.data());
        console.log('-------------------');
      });
    }
  } catch (error) {
    console.error('Error querying database:', error);
  }
}

run();
