export const PESA_KNOWLEDGE = [
    {
        keywords: ['how', 'works', 'procfin', 'pesa', 'process', 'steps'],
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
        keywords: ['gold', 'supplier', 'verified', 'status'],
        question: "What is a Gold Supplier?",
        answer: "Gold Verified status is awarded to suppliers with a proven track record, completed documentation, and an active subscription. Gold suppliers get priority placement in SME matches and a specialized trust badge."
    },
    {
        keywords: ['upgrade', 'verified', 'subscription', 'pro', 'benefit'],
        question: "How do I upgrade to Verified/Pro?",
        answer: "Click the 'Upgrade' or 'Become Verified' button on your dashboard. For R499/mo, SMEs get unlimited RFQs and priority matching, while Suppliers get the ability to submit unlimited quotes and access the national database."
    },
    {
        keywords: ['register', 'sme', 'supplier', 'signup', 'join'],
        question: "How do I register?",
        answer: "Click 'Get Started' on the home page, select your role (SME, Supplier, or Funder), and follow the onboarding steps. You'll need to complete your profile and upload basic compliance documents to start using the platform."
    },
    {
        keywords: ['funding', 'categories', 'industries', 'sectors'],
        question: "What funding categories do you support?",
        answer: "We support a wide range of industries including Construction, IT, Agriculture, Logistics, Healthcare, Manufacturing, Mining, and Retail."
    },
    {
        keywords: ['sme', 'pro', 'starter', 'free', 'tiers', 'subscription', 'price', 'cost'],
        question: "What is the difference between SME Starter and Pro?",
        answer: "The Free/Starter tier allows up to 2 RFQs. SME Pro (R499/mo) offers unlimited RFQs, priority supplier matching, and dedicated funding support."
    },
    {
        keywords: ['supplier', 'verified', 'benefits', 'join', 'database'],
        question: "How do I become a verified supplier?",
        answer: "Register as a supplier and subscribe (R499/mo) to get instant RFQ notifications, submit unlimited quotes, and receive guaranteed milestone payouts via our secure escrow system."
    },
    {
        keywords: ['vault', 'documents', 'security', 'cipc', 'tax', 'bee'],
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
            return `You have ${ctx.deals.length} active deals. ${secured > 0 ? `${secured} of them have successfully secured capital!` : "They are currently being reviewed by our liquidty partners."}`;
        }
    },
    {
        keywords: ['contact', 'support', 'help', 'email'],
        question: "How can I get more help?",
        answer: "You can reach out to our support team via the 'Help' section in your dashboard or email us directly at support@procfin.co.za."
    }
];

export const getPesaResponse = (input, liveContext = {}) => {
    const query = input.toLowerCase();

    // Find the best match based on keywords
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
            return bestMatch.answer(liveContext);
        }
        return bestMatch.answer;
    }

    return "I'm not sure I understand that. Try asking about 'my RFQ status', 'funding progress', 'SME Pro', or 'how it works'.";
};
