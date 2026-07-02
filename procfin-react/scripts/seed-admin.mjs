/**
 * Admin Account Seed Script
 *
 * Run this ONCE to promote an existing Firebase Auth user to ADMIN.
 *
 * Usage:
 *   1. First register normally via the app (any role) using the email you want as admin
 *   2. Then run:  node scripts/seed-admin.mjs <email>
 *
 * Or to seed a brand-new admin (bypassing app registration), create the
 * user in the Firebase Console → Authentication, then run this script.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const email = process.argv[2];
if (!email) {
    console.error('\n❌  Usage: node scripts/seed-admin.mjs <email>\n');
    console.error('   Example: node scripts/seed-admin.mjs faceprint@icloud.com\n');
    process.exit(1);
}

async function seedAdmin() {
    console.log(`\n🔍  Looking up user with email: ${email}...`);

    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);

    if (snap.empty) {
        console.error(`\n❌  No user found with email "${email}".`);
        console.error('   → Register through the app first, then re-run this script.\n');
        process.exit(1);
    }

    const userDoc = snap.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`✅  Found user: ${userData.name || '(no name)'} [${userId}]`);
    console.log(`   Current type: ${userData.type || 'UNKNOWN'}`);

    await setDoc(doc(db, 'users', userId), {
        type: 'ADMIN',
        role: 'admin',
        verified: true,
        onboardingComplete: true,
    }, { merge: true });

    console.log(`\n🎉  Successfully promoted "${email}" to ADMIN!`);
    console.log(`   They can now log in and see the Admin Dashboard + Control Center.\n`);
    process.exit(0);
}

seedAdmin().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
