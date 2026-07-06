/**
 * Helper to wrap content in a beautifully branded ProcFin HTML template
 */
function getEmailWrapper(title, heading, bodyHtml, ctaText, ctaUrl, buttonColor = '#06b6d4') {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0c10;">
        <tr>
            <td align="center" style="padding: 40px 0 30px 0;">
                <!-- Card Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #121318; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 30px 40px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-bottom: 1px solid #1e293b;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="left" style="font-size: 24px; font-weight: 900; letter-spacing: -0.025em; color: #ffffff;">
                                        ⚡ <span style="background: linear-gradient(to right, #22d3ee, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #22d3ee;">ProcFin</span>
                                    </td>
                                    <td align="right" style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b;">
                                        Tender Funding Portal
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px;">
                            <h1 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em;">
                                ${heading}
                            </h1>
                            <div style="font-size: 15px; line-height: 1.6; color: #94a3b8; font-weight: 400;">
                                ${bodyHtml}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Call To Action -->
                    ${ctaText && ctaUrl ? `
                    <tr>
                        <td style="padding: 10px 40px 40px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="left">
                                        <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 30px; background-color: ${buttonColor}; color: #0b0c10; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(6, 182, 212, 0.2); transition: all 0.2s;">
                                            ${ctaText} &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    ` : ''}

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="border-top: 1px solid #1e293b; height: 1px; line-height: 1px;"></div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; font-size: 12px; line-height: 1.5; color: #475569;">
                            <p style="margin: 0 0 10px 0; font-weight: 600; color: #64748b;">
                                Need assistance? Reply directly to this email or contact support at <a href="mailto:support@procfin.online" style="color: #22d3ee; text-decoration: none;">support@procfin.online</a>.
                            </p>
                            <p style="margin: 0;">
                                © ${new Date().getFullYear()} ProcFin (Pty) Ltd. All rights reserved. 33 Bree Street, Cape Town, 8001.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

/**
 * Template for: User Verified Notification
 */
function getVerificationTemplate(name) {
    const body = `
        <p>Hi <strong>${name}</strong>,</p>
        <p>Good news! Your profile has been successfully audited and approved by the ProcFin compliance team.</p>
        <p>Your business is now fully unlocked. You can immediately access the following features:</p>
        <ul style="padding-left: 20px; margin: 15px 0;">
            <li style="margin-bottom: 8px;">Explore matching opportunities in the public sector directories.</li>
            <li style="margin-bottom: 8px;">Submit formal Requests for Quotes (RFQs) to verified SME partners.</li>
            <li style="margin-bottom: 8px;">List your inventory and build your micro-storefront to attract purchase orders.</li>
        </ul>
        <p>Please log in to your dashboard to begin your journey.</p>
    `;
    return getEmailWrapper(
        'Profile Verified ✅',
        'Your ProcFin Profile is Approved!',
        body,
        'Access Dashboard',
        'https://procfin.online',
        '#06b6d4'
    );
}

/**
 * Template for: Funding Request Submitted
 */
function getFundingSubmittedTemplate(smeName, category, amount) {
    const body = `
        <p>Hi <strong>${smeName}</strong>,</p>
        <p>Your request for purchase order funding has been logged successfully and entered our underwriting queue.</p>
        <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #334155;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; padding-bottom: 5px;">Category</td>
                    <td style="color: #ffffff; font-weight: 700; text-align: right; padding-bottom: 5px;">${category}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Amount Requested</td>
                    <td style="color: #10b981; font-weight: 900; text-align: right; font-size: 18px;">R${Number(amount).toLocaleString()}</td>
                </tr>
            </table>
        </div>
        <p>Our network of institutional and private funders is currently reviewing your compliance profile and PO validity. We will update you via email and SMS as soon as the deal structures are proposed.</p>
    `;
    return getEmailWrapper(
        'Funding Request Submitted 💰',
        'Funding Request Received',
        body,
        'Track Funding Progress',
        'https://procfin.online',
        '#06b6d4'
    );
}

/**
 * Template for: RFQ / Quote Accepted
 */
function getRfqAcceptedTemplate(smeName, supplierName, amount) {
    const body = `
        <p>Hi <strong>${smeName}</strong>,</p>
        <p>You have officially confirmed the selection of <strong>${supplierName}</strong>'s quote for your active contract.</p>
        <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #334155;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; padding-bottom: 5px;">Supplier</td>
                    <td style="color: #ffffff; font-weight: 700; text-align: right; padding-bottom: 5px;">${supplierName}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Total Quote Amount</td>
                    <td style="color: #10b981; font-weight: 900; text-align: right; font-size: 18px;">R${Number(amount).toLocaleString()}</td>
                </tr>
            </table>
        </div>
        <p>To finalize funding and lock this contract, proceed to **Phase 3: Deal Securitization** on your dashboard. Once signed, funds will be secured in escrow to allow your supplier to begin fulfillment.</p>
    `;
    return getEmailWrapper(
        'Quote Accepted! 🤝',
        'Supplier Quote Selection Confirmed',
        body,
        'Proceed to Securitization',
        'https://procfin.online',
        '#10b981'
    );
}

module.exports = {
    getVerificationTemplate,
    getFundingSubmittedTemplate,
    getRfqAcceptedTemplate
};
