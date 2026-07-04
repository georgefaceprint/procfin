import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

const products = [
  {
    name: "Premium Aluminium Gazebo 3m x 3m",
    price: 4699,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2022/07/2019-07-17-19.48.51-1.jpg",
    category: "Printing",
    unit: "Unit",
    minOrderQty: 1,
    leadTimeDays: 2,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "24Hr same-day full-color custom printed aluminium frame gazebo. Perfect for corporate events, sports screening tents, and outdoor promotions.",
    volumeTiers: [
      { minQty: 5, price: 4200 },
      { minQty: 10, price: 3999 }
    ]
  },
  {
    name: "Curved Media Wall Banner 2.25m x 3m",
    price: 5100,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2019/02/WhatsApp-Image-2025-10-27-at-11.14.16-1.jpeg",
    category: "Printing",
    unit: "Unit",
    minOrderQty: 1,
    leadTimeDays: 3,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "Curved exhibition wallbanner backdrop, lightweight portable system with premium Ferrari block-out print. Comes with carry bag and full design layout.",
    volumeTiers: [
      { minQty: 3, price: 4800 }
    ]
  },
  {
    name: "Telescopic Bowhead Flags 3m (4 Pole Set)",
    price: 5284,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2025/10/Cluster-Flags2.jpeg",
    category: "Printing",
    unit: "Set",
    minOrderQty: 1,
    leadTimeDays: 2,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "Fountain cluster flagpoles. 4 heavy duty bowhead wind flags with ground spikes and cross bases. Eye-catching promotional flag set.",
    volumeTiers: []
  },
  {
    name: "Single Sharkfin Flag 2m (Bow Banner)",
    price: 850,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2022/07/chromadek-signs-e1533561474658-200x212-1.png",
    category: "Printing",
    unit: "Unit",
    minOrderQty: 2,
    leadTimeDays: 2,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "Double stitched single sided sharkfin wind banner flag with premium hardware, ground spike, and carry case.",
    volumeTiers: [
      { minQty: 10, price: 750 }
    ]
  },
  {
    name: "CSD Correx Boards A1 3mm (50 Pack Special)",
    price: 2150,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2020/06/WhatsApp-Image-2017-10-02-at-14.21.46.jpeg",
    category: "Printing",
    unit: "Pack",
    minOrderQty: 1,
    leadTimeDays: 1,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "Pack of 50 A1 size estate agent correx boards. Fluted polyprop board, waterproof, UV cured direct-to-board digital print.",
    volumeTiers: []
  },
  {
    name: "CSD Correx Boards A2 3mm (50 Pack Special)",
    price: 1360,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2020/06/WhatsApp-Image-2017-10-02-at-14.24.45.jpeg",
    category: "Printing",
    unit: "Pack",
    minOrderQty: 1,
    leadTimeDays: 1,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "Pack of 50 A2 size correx signs. 24Hr rapid printing. Very lightweight but robust fluted plastic signage solution.",
    volumeTiers: []
  },
  {
    name: "Heavy Duty PVC Promo Banner 3m x 1m",
    price: 1250,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2025/10/Full-Color-Pvc-Banners.jpeg",
    category: "Printing",
    unit: "Unit",
    minOrderQty: 1,
    leadTimeDays: 2,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "550gsm heavy duty reinforced PVC banner. Scratch, tear, and fade resistant with solid brass eyelets and reinforced hems.",
    volumeTiers: [
      { minQty: 5, price: 1100 }
    ]
  },
  {
    name: "Mesh Windproof Construction Banner 6m x 2m",
    price: 2850,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-26-at-11.23.28.jpeg",
    category: "Printing",
    unit: "Unit",
    minOrderQty: 1,
    leadTimeDays: 2,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "Heavy duty mesh banners for construction site fence branding. Airflow-friendly mesh fibers to prevent wind damage.",
    volumeTiers: []
  },
  {
    name: "Outdoor Highway Billboard Print (12m x 3m)",
    price: 14500,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2025/10/PVC-Banner-Gauteng-Govt.jpeg",
    category: "Printing",
    unit: "Unit",
    minOrderQty: 1,
    leadTimeDays: 5,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "Large scale billboard skin printing on heavy duty black-backed PVC. Brilliant color replication for high-impact roadside visibility.",
    volumeTiers: []
  },
  {
    name: "Budget Pullup Banners (10 Pack Bundle)",
    price: 6900,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2022/07/10-budget-special-1-1-370x216-1.jpg",
    category: "Printing",
    unit: "Pack",
    minOrderQty: 1,
    leadTimeDays: 2,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "Bulk bundle of 10 roll-up budget stands with non-curl graphic prints and carry bags. Perfect for promotions and exhibitions.",
    volumeTiers: []
  },
  {
    name: "Deluxe Executive Pullup Banner Stand",
    price: 1450,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2018/01/deluxe-pullups-e1755425768906.jpeg",
    category: "Printing",
    unit: "Unit",
    minOrderQty: 1,
    leadTimeDays: 2,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "Premium chrome-finished wide base deluxe pullup banner. Heavy base, no feet layout, block-out non-curl graphic print.",
    volumeTiers: [
      { minQty: 5, price: 1300 }
    ]
  },
  {
    name: "Double-Sided Bowhead Flag 4m",
    price: 1950,
    imageUrl: "https://faceprint.co.za/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-20-at-19.49.37-1.jpeg",
    category: "Printing",
    unit: "Unit",
    minOrderQty: 2,
    leadTimeDays: 2,
    inStock: true,
    supplierId: "supplier_faceprint",
    supplierName: "FacePrint PTY Ltd",
    province: "Gauteng",
    description: "4m double-sided bowhead flag. Multi-layer block-out fabric ensuring your graphics read correctly from both directions.",
    volumeTiers: []
  }
];

async function seed() {
  console.log('Seeding Faceprint products to procfin catalog_items...');
  try {
    for (const prod of products) {
      const docId = 'faceprint_' + prod.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'catalog_items', docId), prod);
      console.log(`Successfully seeded product: ${prod.name}`);
    }

    // Set supplier_faceprint as a FEATURED supplier in users collection
    await setDoc(doc(db, 'users', 'supplier_faceprint'), {
      subscribed: true,
      featured: true,
      promoted: true, // backward compatibility
      plan: "Featured Partner (Monthly Platinum)"
    }, { merge: true });
    console.log('Successfully upgraded supplier_faceprint to Featured Platinum Supplier!');

    console.log('All catalog seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding catalog:', error);
    process.exit(1);
  }
}

seed();
