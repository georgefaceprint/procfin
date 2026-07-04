import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

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

async function fixSeed() {
    try {
        console.log("Fixing catalog items...");
        const snap = await getDocs(collection(db, 'catalog_items'));
        let count = 0;
        for (const d of snap.docs) {
            await updateDoc(doc(db, 'catalog_items', d.id), {
                inStock: true
            });
            count++;
        }
        console.log(`Updated ${count} catalog items to have inStock: true.`);
        process.exit(0);
    } catch (e) {
        console.error("Failed:", e);
        process.exit(1);
    }
}
fixSeed();
