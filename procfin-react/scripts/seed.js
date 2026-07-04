import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBfdTHmctnug0gxFhCfQfRqEPWBLCN5Ujs",
    authDomain: "lambolimos.firebaseapp.com",
    databaseURL: "https://lambolimos-default-rtdb.firebaseio.com",
    projectId: "lambolimos",
    storageBucket: "lambolimos.appspot.com",
    messagingSenderId: "120025515314",
    appId: "1:120025515314:web:ac8587251ddbe1931b832b",
    measurementId: "G-PV5WLNZBPG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'procfin');

async function seed() {
    try {
        console.log("Seeding RFQs for Congo Equip...");
        const usersSnap = await getDocs(collection(db, 'users'));
        let sme1 = null;

        usersSnap.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            if (data.phone === '0792360090' || data.phoneNumber === '0792360090') {
                sme1 = data;
            }
        });

        if (sme1) {
            const rfqs = [
                {
                    title: `Urgent Supply of 50x Laptops for Dept of Education`,
                    category: 'IT Hardware',
                    location: 'Johannesburg, Gauteng',
                    specs: 'Core i5, 8GB RAM, 256GB SSD. Must include 3-year warranty.',
                    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
                    smeId: sme1.id,
                    smeName: sme1.name,
                    status: 'Bidding Open',
                    quotes: [],
                    createdAt: new Date().toISOString()
                },
                {
                    title: `Bulk Procurement of A4 Printing Paper`,
                    category: 'Office Supplies',
                    location: 'Pretoria, Gauteng',
                    specs: '10,000 reams of 80gsm white A4 copy paper. Required for municipal offices.',
                    deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
                    smeId: sme1.id,
                    smeName: sme1.name,
                    status: 'Bidding Open',
                    quotes: [],
                    createdAt: new Date().toISOString()
                }
            ];

            for (const r of rfqs) {
                await addDoc(collection(db, 'rfqs'), r);
            }
            console.log("RFQs seeded for SME 1.");
        }
        process.exit(0);
    } catch (e) {
        console.error("Seed failed:", e);
        process.exit(1);
    }
}
seed();
