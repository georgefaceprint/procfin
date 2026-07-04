import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";

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

async function check() {
    try {
        const q = query(collection(db, 'catalog_items'), limit(3));
        const snap = await getDocs(q);
        snap.forEach(doc => {
            console.log(doc.id, doc.data());
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
