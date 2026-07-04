const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
admin.initializeApp();
const db = getFirestore(undefined, 'procfin');
console.log("Database ID:", db.databaseId || db._settings.databaseId || db.projectId);
