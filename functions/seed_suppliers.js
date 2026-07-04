const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
  projectId: 'lambolimos'
});

const db = getFirestore(admin.app(), 'procfin');

const suppliers = [
  {
    uid: "supplier_faceprint",
    id: "supplier_faceprint",
    name: "FacePrint PTY Ltd",
    companyName: "FacePrint PTY Ltd",
    email: "info@faceprint.co.za",
    phone: "+27 11 482 1234",
    website: "https://faceprint.co.za",
    type: "SUPPLIER",
    role: "SUPPLIER",
    verified: true,
    onboardingComplete: true,
    province: "Gauteng",
    address: "74 De Korte St, Braamfontein, Johannesburg, 2001",
    industry: "Printing & Branding Services",
    preferredCategories: ["Printing", "Textiles", "Office Supplies"],
    rating: 4.8,
    completedDeals: 24,
    registrationNumber: "2018/482910/07",
    taxClearance: "9123849102",
    createdAt: new Date().toISOString()
  },
  {
    uid: "supplier_cape_logistics",
    id: "supplier_cape_logistics",
    name: "Cape Peninsula Logistics",
    companyName: "Cape Peninsula Logistics",
    email: "ops@capelogistics.co.za",
    phone: "+27 21 551 9876",
    website: "https://capelogistics.co.za",
    type: "SUPPLIER",
    role: "SUPPLIER",
    verified: true,
    onboardingComplete: true,
    province: "Western Cape",
    address: "12 Marine Dr, Paarden Eiland, Cape Town, 7405",
    industry: "Logistics & Transport",
    preferredCategories: ["Logistics", "Fuel"],
    rating: 4.6,
    completedDeals: 18,
    registrationNumber: "2015/192837/07",
    taxClearance: "9081726354",
    createdAt: new Date().toISOString()
  },
  {
    uid: "supplier_durban_materials",
    id: "supplier_durban_materials",
    name: "Durban Industrial & Steel",
    companyName: "Durban Industrial & Steel",
    email: "sales@dbnsteel.co.za",
    phone: "+27 31 303 5432",
    website: "https://dbnsteel.co.za",
    type: "SUPPLIER",
    role: "SUPPLIER",
    verified: true,
    onboardingComplete: true,
    province: "KwaZulu-Natal",
    address: "245 Umgeni Rd, Durban, 4001",
    industry: "Construction & Infrastructure",
    preferredCategories: ["Construction Materials", "Industrial Tools"],
    rating: 4.7,
    completedDeals: 31,
    registrationNumber: "2012/094832/07",
    taxClearance: "9584736201",
    createdAt: new Date().toISOString()
  },
  {
    uid: "supplier_pe_textiles",
    id: "supplier_pe_textiles",
    name: "Algoa Bay Textiles",
    companyName: "Algoa Bay Textiles",
    email: "contact@algoatextiles.co.za",
    phone: "+27 41 486 1122",
    website: "https://algoatextiles.co.za",
    type: "SUPPLIER",
    role: "SUPPLIER",
    verified: true,
    onboardingComplete: true,
    province: "Eastern Cape",
    address: "88 Commercial Rd, Sidwell, Gqeberha, 6001",
    industry: "Manufacturing",
    preferredCategories: ["Textiles", "Office Supplies"],
    rating: 4.5,
    completedDeals: 12,
    registrationNumber: "2019/338491/07",
    taxClearance: "9483726150",
    createdAt: new Date().toISOString()
  },
  {
    uid: "supplier_fs_agro",
    id: "supplier_fs_agro",
    name: "Free State Agro-Chemicals",
    companyName: "Free State Agro-Chemicals",
    email: "info@fsagro.co.za",
    phone: "+27 51 430 8899",
    website: "https://fsagro.co.za",
    type: "SUPPLIER",
    role: "SUPPLIER",
    verified: true,
    onboardingComplete: true,
    province: "Free State",
    address: "102 Harvey Rd, Bloemfontein, 9301",
    industry: "Agriculture",
    preferredCategories: ["Fuel", "Industrial Tools"],
    rating: 4.9,
    completedDeals: 42,
    registrationNumber: "2010/129847/07",
    taxClearance: "9102938475",
    createdAt: new Date().toISOString()
  },
  {
    uid: "supplier_limpopo_tech",
    id: "supplier_limpopo_tech",
    name: "Limpopo Digital Solutions",
    companyName: "Limpopo Digital Solutions",
    email: "support@limpopotech.co.za",
    phone: "+27 15 291 3004",
    website: "https://limpopotech.co.za",
    type: "SUPPLIER",
    role: "SUPPLIER",
    verified: true,
    onboardingComplete: true,
    province: "Limpopo",
    address: "56 Landdros Mare St, Polokwane, 0700",
    industry: "Professional Services",
    preferredCategories: ["IT Hardware", "Consultancy"],
    rating: 4.4,
    completedDeals: 15,
    registrationNumber: "2020/293847/07",
    taxClearance: "9283746102",
    createdAt: new Date().toISOString()
  },
  {
    uid: "supplier_mp_minetools",
    id: "supplier_mp_minetools",
    name: "Highveld Mining Supplies",
    companyName: "Highveld Mining Supplies",
    email: "sales@highveldmining.co.za",
    phone: "+27 13 690 1200",
    website: "https://highveldmining.co.za",
    type: "SUPPLIER",
    role: "SUPPLIER",
    verified: true,
    onboardingComplete: true,
    province: "Mpumalanga",
    address: "14 Watermeyer St, Witbank, Emalahleni, 1035",
    industry: "Manufacturing",
    preferredCategories: ["Industrial Tools", "Construction Materials"],
    rating: 4.7,
    completedDeals: 27,
    registrationNumber: "2014/104928/07",
    taxClearance: "9048372619",
    createdAt: new Date().toISOString()
  },
  {
    uid: "supplier_nc_solar",
    id: "supplier_nc_solar",
    name: "Karoo Solar & Power",
    companyName: "Karoo Solar & Power",
    email: "projects@karoosolar.co.za",
    phone: "+27 54 331 4455",
    website: "https://karoosolar.co.za",
    type: "SUPPLIER",
    role: "SUPPLIER",
    verified: true,
    onboardingComplete: true,
    province: "Northern Cape",
    address: "44 Schroder St, Upington, 8801",
    industry: "Construction & Infrastructure",
    preferredCategories: ["Construction Materials", "Consultancy"],
    rating: 4.8,
    completedDeals: 21,
    registrationNumber: "2017/293849/07",
    taxClearance: "9384726190",
    createdAt: new Date().toISOString()
  },
  {
    uid: "supplier_nw_quarry",
    id: "supplier_nw_quarry",
    name: "Rustenburg Quarry Products",
    companyName: "Rustenburg Quarry Products",
    email: "info@nwquarry.co.za",
    phone: "+27 14 592 7788",
    website: "https://nwquarry.co.za",
    type: "SUPPLIER",
    role: "SUPPLIER",
    verified: true,
    onboardingComplete: true,
    province: "North West",
    address: "Kloof Rd, Rustenburg, 0300",
    industry: "Construction & Infrastructure",
    preferredCategories: ["Construction Materials", "Industrial Tools"],
    rating: 4.6,
    completedDeals: 23,
    registrationNumber: "2016/304918/07",
    taxClearance: "9120394857",
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  console.log('Seeding suppliers to procfin database...');
  try {
    for (const supplier of suppliers) {
      await db.collection('users').doc(supplier.uid).set(supplier);
      console.log(`Successfully seeded: ${supplier.name} (${supplier.province})`);
    }
    console.log('All suppliers seeded successfully!');
  } catch (error) {
    console.error('Error seeding suppliers:', error);
  }
}

seed();
