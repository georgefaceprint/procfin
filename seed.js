import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCmoiuwbDodIELIj-TptuEYlIJbVSAKkuQ",
    authDomain: "procfin.firebaseapp.com",
    projectId: "procfin",
    storageBucket: "procfin.firebasestorage.app",
    messagingSenderId: "719005341578",
    appId: "1:719005341578:web:da45b21b454c52a7671a73",
    measurementId: "G-KXN6S8DXB9"
};

const app = initializeApp(firebaseConfig, "seedApp");
const db = getFirestore(app);

const mockSMEs = [
    { name: "Apex Printing Services", id: "mock_sme_1", cat: "Working Capital / Cash Flow", amount: 150000, details: "Need funds to bulk purchase specialized ink and 500 reams of glossy paper for a government tender." },
    { name: "BuildFast Construction", id: "mock_sme_2", cat: "Tender Execution (PO Financing)", amount: 800000, details: "Awarded a PO to supply cement and steel rebar to the new municipal clinic." },
    { name: "AgriGrow Logistics", id: "mock_sme_3", cat: "Asset Finance (Equipment/Vehicles)", amount: 450000, details: "Purchasing an 8-ton refrigerated truck for fresh produce distribution." },
    { name: "TechSavvy Hardware", id: "mock_sme_4", cat: "Tender Execution (PO Financing)", amount: 300000, details: "Supplying 100 laptops and networking gear to local schools." },
    { name: "Retail Hub Stores", id: "mock_sme_5", cat: "Merchant Cash Advance", amount: 120000, details: "Renovating the storefront and expanding winter clothing stock." },
    { name: "Precision Manufacturing", id: "mock_sme_6", cat: "Asset Finance (Equipment/Vehicles)", amount: 950000, details: "Acquiring a new CNC milling machine for precision automotive parts." },
    { name: "Urban Print Co.", id: "mock_sme_7", cat: "Working Capital / Cash Flow", amount: 85000, details: "Working capital to bridge the gap during a 60-day invoice payment window." },
    { name: "Elevate Scaffolding", id: "mock_sme_8", cat: "Tender Execution (PO Financing)", amount: 600000, details: "PO for scaffolding rental and setup for a commercial development project." },
    { name: "EcoFarms Fresh supply", id: "mock_sme_9", cat: "Working Capital / Cash Flow", amount: 200000, details: "Purchasing seeds, fertilizers, and covering labor costs for the upcoming season." },
    { name: "NextGen IT Solutions", id: "mock_sme_10", cat: "Tender Execution (PO Financing)", amount: 550000, details: "Installation of a university-wide fiber-optic network." }
];

async function seed() {
    for (const sme of mockSMEs) {
        await addDoc(collection(db, "deals"), {
            amount: sme.amount,
            category: sme.cat,
            details: sme.details,
            smeId: sme.id,
            smeName: sme.name,
            status: 'Pending Assessment',
            timestamp: Date.now()
        });
        console.log("Seeded:", sme.name);
    }
    console.log("ALL SEEDED SUCCESSFULLY.");
}
seed();
