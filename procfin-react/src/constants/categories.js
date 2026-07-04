// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL SA GOVERNMENT PROCUREMENT CATEGORIES
// Source: SA National Treasury eTenders Portal — data.etenders.gov.za/ProcurementCategory
// These 89 categories are the primary classification system used across all
// 735+ national, provincial and municipal government entities in South Africa.
// Used by: RfqForm, FundingRequest, ProfileEdit, Onboarding, SmeSourcing, SupplierDashboard
// ─────────────────────────────────────────────────────────────────────────────

// Flat list — all 89 official categories, ordered by tender volume (highest first)
export const CATEGORIES = [
    // ── SERVICES ──────────────────────────────────────────────────────────────
    "Services: Professional",
    "Services: General",
    "Services: Functional (Including Cleaning and Security Services)",
    "Services: Electrical",
    "Services: Building",
    "Services: Civil",

    // ── SUPPLIES ──────────────────────────────────────────────────────────────
    "Supplies: General",
    "Supplies: Electrical Equipment",
    "Supplies: Computer Equipment",
    "Supplies: Stationery/Printing",
    "Printing & Signage Services",          // Practical alias — covers print, branding, signage, digital print
    "Supplies: Clothing/Textiles/Footwear",
    "Supplies: Medical",
    "Supplies: Perishable Provisions",

    // ── CONSTRUCTION & INFRASTRUCTURE ─────────────────────────────────────────
    "Construction",
    "Construction of buildings",
    "Civil engineering",
    "Specialised construction activities",

    // ── PROFESSIONAL & CONSULTING ─────────────────────────────────────────────
    "Professional, scientific and technical activities",
    "Other professional, scientific and technical activities",
    "Computer programming, consultancy and related activities",
    "Legal and accounting activities",
    "Architectural and engineering activities; technical testing and analysis",
    "Scientific research and development",
    "Advertising and market research",
    "Activities of head offices; management consultancy activities",

    // ── ICT & TECHNOLOGY ─────────────────────────────────────────────────────
    "Information and communication",
    "Telecommunications",
    "Information service activities",
    "Programming and broadcasting activities",

    // ── ADMIN & SUPPORT SERVICES ─────────────────────────────────────────────
    "Administrative and support activities",
    "Office administrative, office support and other business support activities",
    "Security and investigation activities",
    "Rental and leasing activities",
    "Services to buildings and landscape activities",
    "Other service activities",
    "Other personal service activities",
    "Employment activities",
    "Activities of households as employers of domestic personnel",

    // ── ENERGY & UTILITIES ───────────────────────────────────────────────────
    "Electricity, gas, steam and air conditioning",
    "Water supply; sewerage, waste management and remediation activities",
    "Water collection, treatment and supply",
    "Sewerage",
    "Waste collection, treatment and disposal activities; materials recovery",
    "Remediation activities and other waste management services",

    // ── TRANSPORT & LOGISTICS ─────────────────────────────────────────────────
    "Transportation and storage",
    "Warehousing and support activities for transportation",
    "Land transport and transport via pipelines",
    "Water transport",
    "Air transport",
    "Postal and courier activities",
    "Travel agency, tour operator, reservation service and related activities",

    // ── MANUFACTURING & PRODUCTION ───────────────────────────────────────────
    "Manufacturing",
    "Other manufacturing",
    "Repair and installation of machinery and equipment",
    "Manufacture of chemicals and chemical products",
    "Manufacture of furniture",
    "Manufacture of machinery and equipment n.e.c.",
    "Manufacture of fabricated metal products, except machinery and equipment",
    "Manufacture of motor vehicles, trailers and semi-trailers",
    "Manufacture of electrical equipment",
    "Manufacture of textiles",
    "Manufacture of computer, electronic and optical products",
    "Manufacture of basic metals",
    "Manufacture of coke and refined petroleum products",
    "Manufacture of rubber and plastics products",
    "Manufacture of paper and paper products",
    "Printing and reproduction of recorded media",

    // ── HEALTHCARE & SOCIAL SERVICES ─────────────────────────────────────────
    "Human health activities",
    "Human health and social work activities",
    "Residential care activities",

    // ── EDUCATION ────────────────────────────────────────────────────────────
    "Education",

    // ── FOOD, HOSPITALITY & ACCOMMODATION ────────────────────────────────────
    "Food and beverage service activities",
    "Accommodation",

    // ── FINANCIAL SERVICES ───────────────────────────────────────────────────
    "Financial service activities, except insurance and pension funding",
    "Financial and insurance activities",
    "Insurance, reinsurance and pension funding, except compulsory social security",
    "Activities auxiliary to financial service and insurance activities.",
    "Real estate activities",

    // ── AGRICULTURE, MINING & ENVIRONMENT ────────────────────────────────────
    "Agricultural Products and Services",
    "Mining and quarrying",
    "Mining support service activities",

    // ── ARTS, CULTURE & RECREATION ───────────────────────────────────────────
    "Arts, entertainment and recreation",
    "Creative, arts and entertainment activities",
    "Sports activities and amusement and recreation activities",
    "Libraries, archives, museums and other cultural activities",
    "Motion picture, video and television programme production, sound recording and music publishing activities",
    "Publishing activities",

    // ── TRADE & RETAIL ───────────────────────────────────────────────────────
    "Wholesale and retail trade and repair of motor vehicles and motorcycles",

    // ── DISPOSALS ────────────────────────────────────────────────────────────
    "Disposals: General",
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY GROUPS — for UI display in Sourcing Warehouse, Profile, RFQ
// Each group has an icon, color theme, and maps to official eTenders categories
// ─────────────────────────────────────────────────────────────────────────────
export const CATEGORY_GROUPS = [
    {
        group: "Construction & Infrastructure",
        icon: "🏗️",
        color: "orange",
        description: "Building, civil works, road & site construction",
        items: [
            "Construction",
            "Construction of buildings",
            "Civil engineering",
            "Specialised construction activities",
            "Services: Building",
            "Services: Civil",
            "Services: Electrical",
        ]
    },
    {
        group: "Professional & Consulting",
        icon: "🏛️",
        color: "purple",
        description: "Legal, audit, engineering, project management & research",
        items: [
            "Services: Professional",
            "Professional, scientific and technical activities",
            "Other professional, scientific and technical activities",
            "Legal and accounting activities",
            "Computer programming, consultancy and related activities",
            "Architectural and engineering activities; technical testing and analysis",
            "Scientific research and development",
            "Advertising and market research",
            "Activities of head offices; management consultancy activities",
        ]
    },
    {
        group: "Supplies & Equipment",
        icon: "📦",
        color: "blue",
        description: "General goods, computers, electrical, medical & clothing",
        items: [
            "Supplies: General",
            "Supplies: Electrical Equipment",
            "Supplies: Computer Equipment",
            "Supplies: Stationery/Printing",
            "Supplies: Clothing/Textiles/Footwear",
            "Supplies: Medical",
            "Supplies: Perishable Provisions",
        ]
    },
    {
        group: "Facilities & Support Services",
        icon: "🧹",
        color: "cyan",
        description: "Cleaning, security, facilities, admin & general services",
        items: [
            "Services: General",
            "Services: Functional (Including Cleaning and Security Services)",
            "Administrative and support activities",
            "Security and investigation activities",
            "Services to buildings and landscape activities",
            "Office administrative, office support and other business support activities",
            "Rental and leasing activities",
            "Other service activities",
            "Employment activities",
        ]
    },
    {
        group: "ICT & Technology",
        icon: "💻",
        color: "blue",
        description: "Software, networking, telecoms & digital services",
        items: [
            "Information and communication",
            "Telecommunications",
            "Information service activities",
            "Computer programming, consultancy and related activities",
            "Programming and broadcasting activities",
        ]
    },
    {
        group: "Energy & Utilities",
        icon: "⚡",
        color: "amber",
        description: "Electricity, water, gas, waste & sanitation",
        items: [
            "Electricity, gas, steam and air conditioning",
            "Water supply; sewerage, waste management and remediation activities",
            "Water collection, treatment and supply",
            "Sewerage",
            "Waste collection, treatment and disposal activities; materials recovery",
            "Remediation activities and other waste management services",
        ]
    },
    {
        group: "Transport & Logistics",
        icon: "🚚",
        color: "yellow",
        description: "Freight, courier, fleet, aviation & travel",
        items: [
            "Transportation and storage",
            "Warehousing and support activities for transportation",
            "Land transport and transport via pipelines",
            "Water transport",
            "Air transport",
            "Postal and courier activities",
            "Travel agency, tour operator, reservation service and related activities",
        ]
    },
    {
        group: "Manufacturing & Production",
        icon: "🏭",
        color: "stone",
        description: "Manufacturing, fabrication, repair & industrial production",
        items: [
            "Manufacturing",
            "Other manufacturing",
            "Repair and installation of machinery and equipment",
            "Manufacture of chemicals and chemical products",
            "Manufacture of furniture",
            "Manufacture of machinery and equipment n.e.c.",
            "Manufacture of fabricated metal products, except machinery and equipment",
            "Manufacture of motor vehicles, trailers and semi-trailers",
            "Manufacture of electrical equipment",
            "Manufacture of textiles",
            "Manufacture of computer, electronic and optical products",
            "Manufacture of basic metals",
            "Manufacture of coke and refined petroleum products",
            "Manufacture of rubber and plastics products",
            "Manufacture of paper and paper products",
            "Printing and reproduction of recorded media",
        ]
    },
    {
        group: "Healthcare & Medical",
        icon: "🏥",
        color: "red",
        description: "Medical supplies, health services & social care",
        items: [
            "Supplies: Medical",
            "Human health activities",
            "Human health and social work activities",
            "Residential care activities",
        ]
    },
    {
        group: "Education & Training",
        icon: "🎓",
        color: "indigo",
        description: "Education, skills development & training",
        items: [
            "Education",
        ]
    },
    {
        group: "Food & Hospitality",
        icon: "🍽️",
        color: "green",
        description: "Catering, food supply, accommodation & events",
        items: [
            "Food and beverage service activities",
            "Accommodation",
            "Supplies: Perishable Provisions",
        ]
    },
    {
        group: "Financial Services",
        icon: "💰",
        color: "emerald",
        description: "Banking, insurance, real estate & asset management",
        items: [
            "Financial service activities, except insurance and pension funding",
            "Financial and insurance activities",
            "Insurance, reinsurance and pension funding, except compulsory social security",
            "Activities auxiliary to financial service and insurance activities.",
            "Real estate activities",
        ]
    },
    {
        group: "Agriculture, Mining & Environment",
        icon: "🌾",
        color: "lime",
        description: "Farming, mining, environmental services & natural resources",
        items: [
            "Agricultural Products and Services",
            "Mining and quarrying",
            "Mining support service activities",
        ]
    },
    {
        group: "Arts, Culture & Recreation",
        icon: "🎭",
        color: "pink",
        description: "Media, entertainment, museums, sport & culture",
        items: [
            "Arts, entertainment and recreation",
            "Creative, arts and entertainment activities",
            "Sports activities and amusement and recreation activities",
            "Libraries, archives, museums and other cultural activities",
            "Motion picture, video and television programme production, sound recording and music publishing activities",
            "Publishing activities",
        ]
    },
    {
        group: "Trade & Retail",
        icon: "🛒",
        color: "teal",
        description: "Wholesale, retail & motor trade",
        items: [
            "Wholesale and retail trade and repair of motor vehicles and motorcycles",
        ]
    },
    {
        group: "Disposals",
        icon: "♻️",
        color: "gray",
        description: "Government asset disposals & auctions",
        items: [
            "Disposals: General",
        ]
    },
];
