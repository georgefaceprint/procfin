const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
admin.initializeApp();
const db = getFirestore(undefined, 'procfin');
db.collection('otps').get().then(snap => {
    console.log("Found OTPs: ", snap.docs.length);
    snap.docs.forEach(d => console.log(d.id, d.data()));
}).catch(console.error);
