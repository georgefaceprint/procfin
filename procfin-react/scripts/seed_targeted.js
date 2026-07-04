import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, addDoc, doc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBfdTHmctnug0gxFhCfQfRqEPWBLCN5Ujs",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "lambolimos.firebaseapp.com",
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://lambolimos-default-rtdb.firebaseio.com",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "lambolimos",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "lambolimos.appspot.com",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "120025515314",
    appId: process.env.VITE_FIREBASE_APP_ID || "1:120025515314:web:ac8587251ddbe1931b832b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'procfin');

const categoryProducts = {
    "Printing": [
        { name: "Bulk A4 Flyers (Full Color)", unit: "Batch (1000)", price: 850, minQty: 1, image: "https://images.unsplash.com/photo-1562654501-a0cee0cd9fa5?w=500", desc: "High quality 115gsm gloss flyers." },
        { name: "Corporate Business Cards", unit: "Box (500)", price: 400, minQty: 2, image: "https://images.unsplash.com/photo-1589330694653-0618cb3e74fb?w=500", desc: "Matte finish premium business cards." },
        { name: "Large Format Vinyl Banner", unit: "Meter", price: 250, minQty: 5, image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500", desc: "Outdoor durable PVC vinyl banners." }
    ],
    "Textiles": [
        { name: "Heavy Duty Overalls", unit: "Piece", price: 350, minQty: 20, image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500", desc: "SABS approved industrial workwear overalls." },
        { name: "Reflective Safety Vests", unit: "Piece", price: 85, minQty: 50, image: "https://images.unsplash.com/photo-1596706935293-27eb3df80f33?w=500", desc: "High-vis yellow safety vests for site work." },
        { name: "Corporate Golf Shirts", unit: "Piece", price: 180, minQty: 30, image: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500", desc: "Embroidered 100% cotton golf shirts." }
    ],
    "Office Supplies": [
        { name: "Premium A4 Copy Paper", unit: "Box (5 Reams)", price: 380, minQty: 10, image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500", desc: "Typek 80gsm white printer paper." },
        { name: "Ergonomic Office Chair", unit: "Unit", price: 1850, minQty: 5, image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500", desc: "Mesh back adjustable desk chair." },
        { name: "Whiteboard (1200x900mm)", unit: "Unit", price: 650, minQty: 2, image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500", desc: "Magnetic whiteboard with aluminum frame." }
    ],
    "Logistics": [
        { name: "Pallet Delivery (Local)", unit: "Trip", price: 850, minQty: 1, image: "https://images.unsplash.com/photo-1586528116311-ad8ed7450900?w=500", desc: "Local same-day pallet transportation." },
        { name: "Long-haul Freight (per Ton)", unit: "Ton", price: 1200, minQty: 5, image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500", desc: "Inter-provincial heavy freight hauling." },
        { name: "Warehousing Space", unit: "Sqm/Month", price: 95, minQty: 50, image: "https://images.unsplash.com/photo-1553413002-9a4f66453ff5?w=500", desc: "Secure commercial storage space." }
    ],
    "Fuel": [
        { name: "Diesel 50ppm (Bulk)", unit: "Liter", price: 21.50, minQty: 1000, image: "https://images.unsplash.com/photo-1585834887349-43c2c1fb6c48?w=500", desc: "Wholesale delivery of 50ppm Diesel." },
        { name: "Unleaded 95 (Bulk)", unit: "Liter", price: 22.10, minQty: 1000, image: "https://images.unsplash.com/photo-1605333583995-176840a2a4b8?w=500", desc: "Bulk unleaded petrol delivery for fleets." },
        { name: "Industrial Lubricant Oils", unit: "Drum (210L)", price: 4500, minQty: 2, image: "https://images.unsplash.com/photo-1616422285623-134f16425313?w=500", desc: "Heavy duty machinery engine oils." }
    ],
    "Construction Materials": [
        { name: "Portland Cement (50kg)", unit: "Bag", price: 95, minQty: 100, image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500", desc: "High strength 42.5N building cement." },
        { name: "Clay Stock Bricks", unit: "Pallet (500)", price: 1400, minQty: 10, image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500", desc: "Standard NFP clay masonry bricks." },
        { name: "Corrugated Roof Sheeting", unit: "Meter", price: 85, minQty: 50, image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500", desc: "Galvanized IBR roofing sheets." }
    ],
    "Industrial Tools": [
        { name: "Heavy Duty Angle Grinder", unit: "Unit", price: 1850, minQty: 2, image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500", desc: "230mm industrial angle grinder 2200W." },
        { name: "Professional Welding Kit", unit: "Unit", price: 4200, minQty: 1, image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500", desc: "Inverter welder with helmet and gloves." },
        { name: "Steel Toe Safety Boots", unit: "Pair", price: 650, minQty: 10, image: "https://images.unsplash.com/photo-1517409241517-567f23be3fec?w=500", desc: "Industrial slip-resistant safety boots." }
    ],
    "IT Hardware": [
        { name: "Business Laptop (Core i5)", unit: "Unit", price: 12500, minQty: 5, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500", desc: "15.6 inch Core i5, 8GB RAM, 256GB SSD." },
        { name: "24-inch IPS Monitor", unit: "Unit", price: 2800, minQty: 10, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500", desc: "FHD IPS desktop display for office." },
        { name: "Networking Switch (24 Port)", unit: "Unit", price: 4500, minQty: 2, image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500", desc: "Gigabit managed network switch." }
    ],
    "Consultancy": [
        { name: "BEE Certification Consulting", unit: "Package", price: 8500, minQty: 1, image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500", desc: "Full BEE compliance preparation and audit." },
        { name: "ISO 9001 Quality Audit", unit: "Audit", price: 12000, minQty: 1, image: "https://images.unsplash.com/photo-1554415707-6e8cfc938c22?w=500", desc: "Quality management systems assessment." },
        { name: "Financial Risk Assessment", unit: "Report", price: 6500, minQty: 1, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500", desc: "In-depth corporate financial health report." }
    ],
    "Manufacturing": [
        { name: "Custom Steel Fabrication", unit: "Hour", price: 650, minQty: 10, image: "https://images.unsplash.com/photo-1565514158740-064f34bd6cfd?w=500", desc: "Bespoke mild steel and stainless fabrication." },
        { name: "Plastic Injection Moulding", unit: "Batch", price: 4500, minQty: 1, image: "https://images.unsplash.com/photo-1533568019688-66270b200b34?w=500", desc: "High volume polymer injection manufacturing." },
        { name: "CNC Machined Parts", unit: "Batch", price: 3500, minQty: 1, image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500", desc: "Precision milled aluminum components." }
    ]
};

async function seedTargetedCatalog() {
    try {
        console.log("Deleting old catalog items...");
        const oldSnap = await getDocs(collection(db, 'catalog_items'));
        let delCount = 0;
        for (const d of oldSnap.docs) {
            await deleteDoc(doc(db, 'catalog_items', d.id));
            delCount++;
        }
        console.log(`Deleted ${delCount} old items.`);

        const supSnap = await getDocs(collection(db, 'users'));
        const suppliers = supSnap.docs.map(d => ({id: d.id, ...d.data()})).filter(u => u.type === 'SUPPLIER');
        
        let addedCount = 0;

        for (const supplier of suppliers) {
            // Find category
            let industry = supplier.industry || "Logistics";
            if (!categoryProducts[industry]) {
                industry = "Logistics";
            }
            
            const productsToSeed = categoryProducts[industry];
            
            for (const prod of productsToSeed) {
                await addDoc(collection(db, 'catalog_items'), {
                    supplierId: supplier.id,
                    supplierName: supplier.companyName || supplier.name,
                    category: industry,
                    name: prod.name,
                    description: prod.desc,
                    price: prod.price,
                    unit: prod.unit,
                    minOrderQty: prod.minQty,
                    leadTimeDays: Math.floor(Math.random() * 5) + 1,
                    image: prod.image,
                    status: 'approved',
                    inStock: true,
                    createdAt: new Date().toISOString()
                });
                addedCount++;
            }
        }
        console.log(`Successfully seeded ${addedCount} targeted products!`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedTargetedCatalog();
