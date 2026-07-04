const admin = require('firebase-admin');

// Initialize admin SDK (using default credentials)
admin.initializeApp({
  projectId: 'lambolimos'
});

const db = admin.firestore('procfin');

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
