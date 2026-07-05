const admin = require('firebase-admin');

// We use default app initialization, it uses ADC (Application Default Credentials)
admin.initializeApp({ projectId: 'lambolimos' }); // The project used in verifyVaultDocument is lambolimos
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore(undefined, 'procfin');

async function test() {
    try {
        const snap = await db.collection('users').limit(1).get();
        console.log("Found users:", snap.size);
    } catch (e) {
        console.error(e);
    }
}
test();
