export function calculateSupplierScore(supplier, documents = {}) {
    let score = 0;
    const checks = {
        csd: false,
        tax: false,
        cipc: false,
        bank: false,
        address: false,
        bee: false,
        catalog: false,
        references: false
    };

    const isPrivate = supplier.businessModel === 'Private B2B / Corporate';

    // 1. CSD / Trade References (20 Points)
    if (isPrivate) {
        const refCount = Number(supplier.tradeReferencesCount) || 0;
        if (refCount >= 2) {
            score += 20;
            checks.references = true;
        } else if (refCount === 1) {
            score += 10;
        }
    } else {
        if (supplier.csdNumber) {
            score += 20;
            checks.csd = true;
        }
    }

    // 2. SARS Tax Compliance (20 Points)
    if (documents['2']?.aiVerification?.status === 'VERIFIED') {
        score += 20;
        checks.tax = true;
    }

    // 3. CIPC Registration (15 Points)
    if (documents['3']?.aiVerification?.status === 'VERIFIED') {
        score += 15;
        checks.cipc = true;
    }

    // 4. Bank Confirmation Letter (15 Points)
    if (documents['4']) {
        score += 15;
        checks.bank = true;
    }

    // 5. Proof of Address (10 Points)
    if (documents['6']) {
        score += 10;
        checks.address = true;
    }

    // 6. BEE Certificate (10 Points)
    if (documents['7'] || documents['5']) {
        score += 10;
        checks.bee = true;
    }

    // 7. Storefront Catalog Completion (10 Points)
    const catalogCount = Number(supplier.catalogCount) || 0;
    if (catalogCount >= 3) {
        score += 10;
        checks.catalog = true;
    } else if (catalogCount > 0) {
        score += 5;
    }

    score = Math.min(100, score);

    let grade = 'E';
    if (score >= 90) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 40) grade = 'D';

    let tier = 'Silver';
    if (grade === 'A') tier = 'Platinum';
    else if (grade === 'B' || grade === 'C' || supplier.subscribed) tier = 'Gold';

    return { score, grade, tier, checks, isPrivate };
}
