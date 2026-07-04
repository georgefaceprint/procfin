export const PESA_KNOWLEDGE = [
    {
        keywords: ['how', 'works', 'procfin', 'zandile', 'process', 'steps'],
        question: "How does ProcFin work?",
        answer: "ProcFin is a 3-step platform: 1. Digital Onboarding (upload docs to your vault), 2. RFQ Generation (request quotes from verified suppliers), 3. Capital Deployment (get matched with funders to pay suppliers and fulfill contracts)."
    },
    {
        keywords: ['create', 'rfq', 'request', 'quote', 'sme'],
        question: "How do I create an RFQ?",
        answer: "As an SME, go to your dashboard and click 'Request Quote'. Fill in the title, category, location, and detailed specifications. Once submitted, verified suppliers in that category will be notified to send you quotes."
    },
    {
        keywords: ['submit', 'quote', 'supplier', 'respond'],
        question: "How do I submit a quote?",
        answer: "As a Verified Supplier, browse the 'Live RFQ Feed' on your dashboard. Click 'Submit Custom Quote' on any RFQ that matches your business, enter your price and delivery notes, and the SME will be notified instantly."
    },
    {
        keywords: ['catalog', 'warehouse', 'sourcing', 'inventory', 'supplier products'],
        question: "How does the Sourcing Warehouse Catalog work?",
        answer: "The Sourcing Warehouse Catalog is a national inventory where verified suppliers list products and pricing. SMEs can browse, compare products side-by-side, add items to their cart, and instantly apply for PO Financing. Suppliers can unlock this premium listing module for R1,499/month."
    },
    {
        keywords: ['gold', 'silver', 'platinum', 'badge', 'trust', 'status', 'tier'],
        question: "What are Silver, Gold, and Platinum trust badges?",
        answer: "We use a 3-tier trust system: 1. Silver (Standard verified partner). 2. Gold Verified (Subscribed to R499 bid board, completed initial vault compliance). 3. Platinum Enterprise (Subscribed to R3,999 Promoted Partner, 100% compliance audit score, rating above 4.5)."
    },
    {
        keywords: ['promoted', 'carousel', '3999', 'benefit', 'featured', 'advertising'],
        question: "What is the Promoted Supplier Plan?",
        answer: "For R3,999/month, Promoted Suppliers get maximum visibility: 1. Top sorting priority in Sourcing categories. 2. Active placement in the Featured Product Carousel. 3. Direct qualification for the Platinum Trust Badge. 4. Priority introduction to platform funders."
    },
    {
        keywords: ['upgrade', 'verified', 'subscription', 'pro', 'benefit', 'pricing', 'fees', 'cost'],
        question: "What are the fees and subscription costs?",
        answer: "1. SME Pro: R499/month (unlimited RFQs, priority matching). 2. Supplier Bid Board: R499/month (quote on RFQs). 3. Supplier Sourcing Catalog: R1,499/month (list products). 4. Supplier Promoted Partner: R3,999/month (carousel & top category placement). 5. Escrow: 3% flat fee. 6. Funder: 2.5% interest per 30 days."
    },
    {
        keywords: ['register', 'sme', 'supplier', 'signup', 'join'],
        question: "How do I register?",
        answer: "Click 'Get Started' on the home page, select your role (SME, Supplier, or Funder), and follow the onboarding steps. You'll need to complete your profile and upload basic compliance documents to start using the platform."
    },
    {
        keywords: ['funding', 'categories', 'industries', 'sectors'],
        question: "What funding categories do you support?",
        answer: "We support a wide range of industries including Printing, Textiles, Office Supplies, Logistics, Fuel, Construction Materials, Industrial Tools, IT Hardware, Consultancy, and Manufacturing."
    },
    {
        keywords: ['vault', 'documents', 'security', 'cipc', 'tax', 'bee', 'safe'],
        question: "What is the Digital Vault?",
        answer: "The Digital Vault is an encrypted storage for your CIPC docs, Tax Clearance, and BEE certificates. It allows for instant compliance scoring and audit-readiness 24/7."
    },
    {
        keywords: ['escrow', 'payment', 'payout', 'guarantee', 'safe'],
        question: "How are payments guaranteed?",
        answer: "All contracts are backed by verified funding. Payments are held in our secure escrow and released in milestones once proof of delivery (waybills) is uploaded."
    },
    {
        keywords: ['funder', 'investor', 'liquidity'],
        question: "How do I join as a funder?",
        answer: "Financial institutions and private funders can register to review verified SME tender opportunities and deploy capital securely through our platform."
    },
    {
        keywords: ['status', 'my', 'rfq', 'active', 'requests'],
        question: "What is the status of my RFQs?",
        answer: (ctx) => {
            if (!ctx.rfqs || ctx.rfqs.length === 0) return "You don't have any active RFQs at the moment. Would you like to create one?";
            const active = ctx.rfqs.filter(r => r.status === 'Requested').length;
            const closed = ctx.rfqs.filter(r => r.status.includes('Closed')).length;
            return `You have ${ctx.rfqs.length} total RFQs: ${active} are currently active/awaiting quotes, and ${closed} have been successfully closed.`;
        }
    },
    {
        keywords: ['my', 'deals', 'funding', 'progress', 'money'],
        question: "How is my funding progressing?",
        answer: (ctx) => {
            if (!ctx.deals || ctx.deals.length === 0) return "I couldn't find any active funding deals for your account. You can apply for funding once an RFQ quote is accepted.";
            const secured = ctx.deals.filter(d => d.status === 'Capital Secured').length;
            return `You have ${ctx.deals.length} active deals. ${secured > 0 ? `${secured} of them have successfully secured capital!` : "They are currently being reviewed by our liquidity partners."}`;
        }
    },
    {
        keywords: ['compliance', 'status', 'verified', 'verify', 'am i'],
        question: "What is my compliance status?",
        answer: (ctx, user) => {
            if (!user) return "Please log in to check your compliance status.";
            if (user.promoted) return "You are a Platinum Featured Partner with a 100% compliance score!";
            if (user.subscribed) return "You are a Gold Verified member with active compliance.";
            return "You are currently a Standard member. Please ensure your vault documents are uploaded and consider upgrading to Verified status for guaranteed escrow payouts.";
        }
    },
    {
        keywords: ['contact', 'support', 'help', 'email'],
        question: "How can I get more help?",
        answer: "You can reach out to our support team via the 'Help' section in your dashboard or email us directly at support@procfin.co.za."
    }
];

export const getZandileResponse = (input, liveContext = {}, user = null) => {
    const query = input.toLowerCase();

    let bestMatch = null;
    let maxKeywords = 0;

    for (const item of PESA_KNOWLEDGE) {
        const matchCount = item.keywords.filter(kw => query.includes(kw)).length;
        if (matchCount > maxKeywords) {
            maxKeywords = matchCount;
            bestMatch = item;
        }
    }

    if (maxKeywords > 0) {
        if (typeof bestMatch.answer === 'function') {
            return bestMatch.answer(liveContext, user);
        }
        return bestMatch.answer;
    }

    return "I'm not sure I understand that. Try asking about 'compliance status', 'Sourcing Warehouse', 'how it works', or check your 'RFQ status'.";
};
