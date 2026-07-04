const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp();
const db = getFirestore(undefined, 'procfin');

async function updateFaceprintCategories() {
    // Search for Faceprint by name
    const usersRef = db.collection('users');
    
    // Try several name variants
    const queries = [
        usersRef.where('name', '>=', 'Face').where('name', '<=', 'Face\uf8ff').get(),
        usersRef.where('companyName', '>=', 'Face').where('companyName', '<=', 'Face\uf8ff').get(),
        usersRef.where('name', '>=', 'face').where('name', '<=', 'face\uf8ff').get(),
    ];

    const snapshots = await Promise.all(queries);
    const found = new Map();

    snapshots.forEach(snap => {
        snap.forEach(doc => {
            found.set(doc.id, { id: doc.id, ...doc.data() });
        });
    });

    if (found.size === 0) {
        // Fallback: list all SUPPLIER type users
        console.log('No Faceprint found by name. Listing all SUPPLIER users:');
        const allSuppliers = await usersRef.where('type', '==', 'SUPPLIER').get();
        allSuppliers.forEach(doc => {
            const d = doc.data();
            console.log(`  ${doc.id}: name="${d.name}" | companyName="${d.companyName}" | categories=${JSON.stringify(d.preferredCategories)}`);
        });
        return;
    }

    console.log(`Found ${found.size} matching user(s):`);

    for (const [id, user] of found) {
        console.log(`\nUser: ${user.name || user.companyName || 'Unknown'} (${id})`);
        console.log(`  Type: ${user.type}`);
        console.log(`  Current categories: ${JSON.stringify(user.preferredCategories || user.industry || [])}`);

        const existingCats = Array.isArray(user.preferredCategories) ? user.preferredCategories
            : Array.isArray(user.industry) ? user.industry : [];

        const printingCats = [
            'Supplies: Stationery/Printing',
            'Printing & Signage Services',
            'Printing and reproduction of recorded media',
        ];

        const merged = [...new Set([...existingCats, ...printingCats])].slice(0, 10);

        await db.collection('users').doc(id).update({
            preferredCategories: merged,
            industry: merged,
        });

        console.log(`  ✅ Updated categories to: ${JSON.stringify(merged)}`);
    }
}

updateFaceprintCategories()
    .then(() => { console.log('\nDone!'); process.exit(0); })
    .catch(err => { console.error('Error:', err); process.exit(1); });
