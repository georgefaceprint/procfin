import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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
const auth = getAuth(app);
const db = initializeFirestore(app, {}, 'procfin');

async function createAdmin() {
    try {
        console.log("Creating admin user...");
        const email = 'georgefaceprint@gmail.com';
        const password = 'Jethro@#1973';
        
        let user;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') {
                console.log('User already exists, signing in...');
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
            } else {
                throw e;
            }
        }
        
        console.log("User retrieved. Setting Firestore profile...");
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            name: 'George',
            type: 'ADMIN',
            role: 'ADMIN',
            createdAt: serverTimestamp()
        });
        
        console.log("Admin account successfully created!");
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin account:", error.message);
        process.exit(1);
    }
}

createAdmin();
