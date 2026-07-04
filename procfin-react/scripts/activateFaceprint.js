/**
 * activateFaceprint.js
 * Run with: node scripts/activateFaceprint.js
 * Activates Faceprint's catalogActive flag and marks them as subscribed + promoted
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load service account
const serviceAccountPath = resolve(__dirname, '../../serviceAccountKey.json');
let serviceAccount;
try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (e) {
    console.error('❌ Could not load serviceAccountKey.json. Make sure it exists at:', serviceAccountPath);
    process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function activateFaceprint() {
    console.log('🔍 Searching for Faceprint supplier account...');

    const usersRef = db.collection('users');
    const snapshot = await usersRef
        .where('type', '==', 'SUPPLIER')
        .get();

    const faceprintDocs = snapshot.docs.filter(doc => {
        const data = doc.data();
        const name = (data.name || data.companyName || '').toLowerCase();
        return name.includes('faceprint');
    });

    if (faceprintDocs.length === 0) {
        console.log('⚠️  No Faceprint supplier found. Listing all SUPPLIER accounts:');
        snapshot.docs.forEach(d => {
            console.log(`  - ID: ${d.id} | Name: ${d.data().name || d.data().companyName}`);
        });
        console.log('\nRun again after identifying the correct supplier ID and updating the script.');
        return;
    }

    for (const docSnap of faceprintDocs) {
        const id = docSnap.id;
        const data = docSnap.data();
        console.log(`\n✅ Found: ${data.name || data.companyName} (${id})`);

        const update = {
            subscribed: true,
            catalogActive: true,
            catalogSubscriptionStatus: 'active',
            catalogSubscriptionPrice: 1499,
            catalogRenewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            promoted: true,
            featuredUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
            rating: 5.0,
            verified: true,
        };

        await db.collection('users').doc(id).set(update, { merge: true });
        console.log('✅ Faceprint profile updated with:');
        console.log('   subscribed: true');
        console.log('   catalogActive: true');
        console.log('   promoted: true');
        console.log('   verified: true');
        console.log('   rating: 5.0');
        console.log(`   featuredUntil: ${update.featuredUntil}`);
    }

    console.log('\n🎉 Done! Faceprint is now a Featured Platinum Partner with Catalog Access.');
}

activateFaceprint().catch(console.error);
