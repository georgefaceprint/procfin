const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");

admin.initializeApp();
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore(undefined, 'procfin');

// Configure the email transport using the default SMTP transport and a Gmail account/App Password.
// For production, using SendGrid or Mailgun is recommended.
const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Utility to send an SMS via BulkSMS.com REST API
 */
const sendSMS = async (phoneNumber, message) => {
    try {
        if (!phoneNumber) return;
        
        // Ensure phone number starts with + or country code. Defaulting to +27 if it starts with 0
        let formattedNumber = phoneNumber.replace(/\s+/g, '');
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '+27' + formattedNumber.substring(1);
        } else if (!formattedNumber.startsWith('+')) {
            formattedNumber = '+' + formattedNumber;
        }

        const tokenId = process.env.BULKSMS_TOKEN_ID;
        const tokenSecret = process.env.BULKSMS_TOKEN_SECRET;

        if (!tokenId || !tokenSecret) {
            console.warn('BulkSMS credentials not set. SMS aborted.');
            return;
        }

        const authBuffer = Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64');

        const response = await axios.post('https://api.bulksms.com/v1/messages', {
            to: formattedNumber,
            body: message
        }, {
            headers: {
                'Authorization': `Basic ${authBuffer}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`SMS sent successfully to ${formattedNumber}. Message ID: ${response.data[0].id}`);
    } catch (error) {
        console.error('Error sending SMS via BulkSMS:', error.response ? error.response.data : error.message);
    }
};

/**
 * Utility to send a Native Push Notification via Firebase Cloud Messaging
 */
const sendPushNotification = async (token, title, body) => {
    if (!token) return;
    try {
        await admin.messaging().send({
            token: token,
            notification: {
                title: title,
                body: body
            }
        });
        console.log(`Push notification sent successfully to token: ${token}`);
    } catch (error) {
        console.error('Error sending Push Notification:', error);
    }
};

const sendPushToUser = async (userData, title, body) => {
    const promises = [];
    if (userData.pushToken) {
        promises.push(sendPushNotification(userData.pushToken, title, body));
    }
    if (userData.fcmToken && userData.fcmToken !== userData.pushToken) {
        promises.push(sendPushNotification(userData.fcmToken, title, body));
    }
    await Promise.all(promises);
};

exports.onUserVerified = onDocumentUpdated({
    document: 'users/{userId}',
    database: 'procfin'
}, async (event) => {
    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();

    // Check if the verified field changed from false/undefined to true
    if (newValue.verified === true && previousValue.verified !== true) {
        const email = newValue.email;
        const name = newValue.name || 'User';

        const mailOptions = {
            from: '"ProcFin" <noreply@procfin.co.za>',
            to: email,
            subject: 'ProcFin - Profile Verified ✅',
            text: `Hello ${name},\n\nGood news! Your profile has been successfully verified by a ProcFin admin.\n\nYou can now fully utilize the platform to matching with funders and requesting quotes.\n\nBest Regards,\nThe ProcFin Team`,
            html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #3b82f6;">Profile Verified! ✅</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Good news! Your profile has been successfully verified by a ProcFin admin.</p>
            <p>You can now fully utilize the platform to match with funders and request quotes from our national database.</p>
            <br/>
            <a href="https://procfin.vercel.app" style="background:#3b82f6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Go to Dashboard</a>
            <br/><br/>
            <p>Best Regards,</p>
            <p><strong>The ProcFin Team</strong></p>
          </div>
        `
        };

        try {
            await mailTransport.sendMail(mailOptions);
            console.log(`Verification email successfully sent to: ${email}`);
            
            // Trigger SMS alert to SME
            if (newValue.whatsapp) {
                await sendSMS(newValue.whatsapp, `ProcFin: Good news ${name}! Your profile has been successfully verified. You can now request funding and quote on RFQs.`);
            }

            // Trigger Push Notification
            await sendPushToUser(newValue, 'Profile Verified! ✅', `Good news ${name}! Your profile has been successfully verified.`);
        } catch (error) {
            console.error('Error sending verification email:', error);
        }
    } else {
        console.log('User was updated but verification status did not change to true.');
    }

    return null;
});

exports.onDealCreated = onDocumentCreated({
    document: 'deals/{dealId}',
    database: 'procfin'
}, async (event) => {
    const deal = event.data.data();
    const smeId = deal.smeId;

    // Fetch SME email from users collection
    const smeSnap = await db.collection('users').doc(smeId).get();
    if (!smeSnap.exists) return null;
    const smeData = smeSnap.data();
    const smeEmail = smeData.email;
    const smeName = smeData.name || 'User';

    const mailOptions = {
        from: '"ProcFin" <noreply@procfin.co.za>',
        to: [smeEmail, 'faceprint@icloud.com'], // Send to SME and test email
        subject: 'ProcFin - Funding Request Submitted 💰',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #3b82f6;">Funding Request Received! 💰</h2>
            <p>Hello <strong>${smeName}</strong>,</p>
            <p>Your funding request of <strong>R${Number(deal.amount).toLocaleString()}</strong> for the category <strong>${deal.category}</strong> has been successfully submitted and is now being matched with verified funders.</p>
            <p>We will notify you as soon as a funder starts reviewing your application.</p>
            <br/>
            <p>Best Regards,</p>
            <p><strong>The ProcFin Team</strong></p>
          </div>
        `
    };

    try {
        await mailTransport.sendMail(mailOptions);
        console.log(`Funding request email successfully sent to: ${smeEmail}`);

        // Trigger SMS to SME
        if (smeData.whatsapp) {
            await sendSMS(smeData.whatsapp, `ProcFin: Your funding request of R${Number(deal.amount).toLocaleString()} for ${deal.category} has been submitted. We will notify you when a funder reviews it.`);
        }
        
        // Trigger Push Notification
        await sendPushToUser(smeData, 'Funding Request Submitted 💰', `Your request of R${Number(deal.amount).toLocaleString()} is being matched with funders.`);
    } catch (error) {
        console.error('Error sending funding request email:', error);
    }
    return null;
});

exports.onDealUpdated = onDocumentUpdated({
    document: 'deals/{dealId}',
    database: 'procfin'
}, async (event) => {
    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();
    
    // Trigger when status changes to 'Capital Secured'
    if (newValue.status === 'Capital Secured' && previousValue.status !== 'Capital Secured') {
        const smeId = newValue.smeId;
        const supplierId = newValue.supplierId;
        
        // Notify SME
        if (smeId) {
            const smeSnap = await db.collection('users').doc(smeId).get();
            if (smeSnap.exists) {
                const smeData = smeSnap.data();
                if (smeData.whatsapp) {
                    await sendSMS(smeData.whatsapp, `ProcFin: Great news! Your funding request for ${newValue.supplierName || 'your supplier'} has been approved and capital secured! Log in to view contract.`);
                }
                await sendPushToUser(smeData, 'Capital Secured! 💰', `Funding approved for ${newValue.supplierName || 'your supplier'}.`);
            }
        }
        
        // Notify Supplier
        if (supplierId) {
            const supplierSnap = await db.collection('users').doc(supplierId).get();
            if (supplierSnap.exists) {
                const supplierData = supplierSnap.data();
                if (supplierData.whatsapp) {
                    await sendSMS(supplierData.whatsapp, `ProcFin: ${newValue.smeName} has secured funding for their contract. Funds are in escrow. You may begin fulfillment.`);
                }
                await sendPushToUser(supplierData, 'Contract Funded! 🔒', `${newValue.smeName} secured funding. Funds in escrow.`);
            }
        }
    }
    return null;
});

exports.onRfqCreated = onDocumentCreated({
    document: 'rfqs/{rfqId}',
    database: 'procfin'
}, async (event) => {
    const rfq = event.data.data();
    const supplierId = rfq.supplierId;
    
    if (supplierId) {
        const supplierSnap = await db.collection('users').doc(supplierId).get();
        if (supplierSnap.exists) {
            const supplierData = supplierSnap.data();
            const smeName = rfq.smeName || 'A business';
            
            if (supplierData.whatsapp) {
                await sendSMS(supplierData.whatsapp, `ProcFin: You have received a new Request for Quote (RFQ) from ${smeName}. Log in to procfin.online to review and submit your formal quote.`);
            }
            await sendPushToUser(supplierData, 'New RFQ Received! 📋', `You have received a new RFQ from ${smeName}.`);
        }
    }
    return null;
});

exports.onRfqAccepted = onDocumentUpdated({
    document: 'rfqs/{rfqId}',
    database: 'procfin'
}, async (event) => {
    const newValue = event.data.after.data();
    const previousValue = event.data.before.data();

    // Trigger when status changes to 'Closed (Quote Accepted)'
    if (newValue.status === 'Closed (Quote Accepted)' && previousValue.status !== 'Closed (Quote Accepted)') {
        const smeId = newValue.smeId;
        const smeSnap = await db.collection('users').doc(smeId).get();
        if (!smeSnap.exists) return null;
        
        const smeData = smeSnap.data();
        const smeEmail = smeData.email;
        const smeName = smeData.name || 'User';
        const supplierName = newValue.acceptedQuote?.supplierName || 'a supplier';
        const amount = newValue.acceptedQuote?.amount || 0;

        const mailOptions = {
            from: '"ProcFin" <noreply@procfin.co.za>',
            to: [smeEmail, 'faceprint@icloud.com'], // Send to SME and test email
            subject: 'ProcFin - Quote Accepted! 🤝',
            html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #10b981;">Quote Selection Confirmed! 🤝</h2>
            <p>Hello <strong>${smeName}</strong>,</p>
            <p>You have successfully accepted <strong>${supplierName}</strong>'s quote for <strong>R${Number(amount).toLocaleString()}</strong>.</p>
            <p>You can now proceed to <strong>Phase 3: Deal Securitization</strong> in your dashboard to secure funding for this contract.</p>
            <br/>
            <a href="https://procfin.vercel.app" style="background:#10b981;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Proceed to Funding</a>
            <br/><br/>
            <p>Best Regards,</p>
            <p><strong>The ProcFin Team</strong></p>
          </div>
        `
        };

        try {
            await mailTransport.sendMail(mailOptions);
            console.log(`RFQ acceptance email successfully sent to: ${smeEmail}`);

            // Trigger SMS to SME
            if (smeData.whatsapp) {
                await sendSMS(smeData.whatsapp, `ProcFin: You accepted ${supplierName}'s quote for R${Number(amount).toLocaleString()}. Log in to secure your funding.`);
            }
            await sendPushToUser(smeData, 'Quote Accepted! 🤝', `You accepted ${supplierName}'s quote for R${Number(amount).toLocaleString()}.`);
        } catch (error) {
            console.error('Error sending RFQ acceptance email:', error);
        }
    }
    return null;
});

exports.seedSuppliers = onRequest(async (req, res) => {
    const suppliers = [
      // Gauteng
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
        subscribed: true,
        catalogActive: true,
        catalogSubscriptionStatus: "active",
        catalogSubscriptionPrice: 1499,
        promoted: true,
        province: "Gauteng",
        address: "74 De Korte St, Braamfontein, Johannesburg, 2001",
        industry: "Printing & Branding Services",
        preferredCategories: ["Supplies: Stationery/Printing", "Printing & Signage Services", "Printing and reproduction of recorded media"],
        rating: 5.0,
        completedDeals: 24,
        registrationNumber: "2018/482910/07",
        taxClearance: "9123849102",
        createdAt: new Date().toISOString()
      },
      {
        uid: "supplier_randburg_tech",
        id: "supplier_randburg_tech",
        name: "Randburg Tech & Cables",
        companyName: "Randburg Tech & Cables",
        email: "sales@randburgtech.co.za",
        phone: "+27 11 789 5544",
        website: "https://randburgtech.co.za",
        type: "SUPPLIER",
        role: "SUPPLIER",
        verified: true,
        onboardingComplete: true,
        province: "Gauteng",
        address: "155 Hendrik Verwoerd Dr, Randburg, 2194",
        industry: "Professional Services",
        preferredCategories: ["IT Hardware", "Consultancy"],
        rating: 4.5,
        completedDeals: 14,
        registrationNumber: "2021/304859/07",
        taxClearance: "9384756201",
        createdAt: new Date().toISOString()
      },
      // Western Cape
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
        uid: "supplier_table_mountain",
        id: "supplier_table_mountain",
        name: "Table Mountain Printing & Paper",
        companyName: "Table Mountain Printing & Paper",
        email: "orders@tablemtnprint.co.za",
        phone: "+27 21 447 3322",
        website: "https://tablemtnprint.co.za",
        type: "SUPPLIER",
        role: "SUPPLIER",
        verified: true,
        onboardingComplete: true,
        province: "Western Cape",
        address: "85 Albert Rd, Woodstock, Cape Town, 7925",
        industry: "Printing & Branding Services",
        preferredCategories: ["Supplies: Stationery/Printing", "Printing & Signage Services"],
        rating: 4.7,
        completedDeals: 22,
        registrationNumber: "2019/128493/07",
        taxClearance: "9483726105",
        createdAt: new Date().toISOString()
      },
      // KwaZulu-Natal
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
        uid: "supplier_kzn_logistics",
        id: "supplier_kzn_logistics",
        name: "KZN Logistics & Transport",
        companyName: "KZN Logistics & Transport",
        email: "dispatch@kznlogistics.co.za",
        phone: "+27 31 569 8800",
        website: "https://kznlogistics.co.za",
        type: "SUPPLIER",
        role: "SUPPLIER",
        verified: true,
        onboardingComplete: true,
        province: "KwaZulu-Natal",
        address: "12 Joyner Rd, Prospecton, Durban, 4133",
        industry: "Logistics & Transport",
        preferredCategories: ["Logistics", "Fuel"],
        rating: 4.4,
        completedDeals: 16,
        registrationNumber: "2016/293847/07",
        taxClearance: "9283746190",
        createdAt: new Date().toISOString()
      },
      // Eastern Cape
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
        uid: "supplier_pe_concrete",
        id: "supplier_pe_concrete",
        name: "PE Concrete & Aggregates",
        companyName: "PE Concrete & Aggregates",
        email: "sales@peconcrete.co.za",
        phone: "+27 41 453 2938",
        website: "https://peconcrete.co.za",
        type: "SUPPLIER",
        role: "SUPPLIER",
        verified: true,
        onboardingComplete: true,
        province: "Eastern Cape",
        address: "144 Burman Rd, Deal Party, Gqeberha, 6001",
        industry: "Construction & Infrastructure",
        preferredCategories: ["Construction Materials", "Industrial Tools"],
        rating: 4.8,
        completedDeals: 25,
        registrationNumber: "2011/304958/07",
        taxClearance: "9102938475",
        createdAt: new Date().toISOString()
      },
      // Free State
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
        uid: "supplier_bloem_office",
        id: "supplier_bloem_office",
        name: "Bloem Office Supplies",
        companyName: "Bloem Office Supplies",
        email: "sales@bloemoffice.co.za",
        phone: "+27 51 448 9911",
        website: "https://bloemoffice.co.za",
        type: "SUPPLIER",
        role: "SUPPLIER",
        verified: true,
        onboardingComplete: true,
        province: "Free State",
        address: "45 Zastron St, Bloemfontein, 9301",
        industry: "Printing & Branding Services",
        preferredCategories: ["Supplies: Stationery/Printing", "Printing & Signage Services"],
        rating: 4.6,
        completedDeals: 19,
        registrationNumber: "2018/129840/07",
        taxClearance: "9283746199",
        createdAt: new Date().toISOString()
      },
      // Limpopo
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
        uid: "supplier_polokwane_fuel",
        id: "supplier_polokwane_fuel",
        name: "Polokwane Fuel & Oils",
        companyName: "Polokwane Fuel & Oils",
        email: "orders@polokwanefuel.co.za",
        phone: "+27 15 297 8899",
        website: "https://polokwanefuel.co.za",
        type: "SUPPLIER",
        role: "SUPPLIER",
        verified: true,
        onboardingComplete: true,
        province: "Limpopo",
        address: "12 Industry Rd, Polokwane, 0699",
        industry: "Logistics & Transport",
        preferredCategories: ["Fuel", "Logistics"],
        rating: 4.7,
        completedDeals: 28,
        registrationNumber: "2013/304918/07",
        taxClearance: "9048372619",
        createdAt: new Date().toISOString()
      },
      // Mpumalanga
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
        uid: "supplier_nelspruit_print",
        id: "supplier_nelspruit_print",
        name: "Nelspruit Stationery & Printing",
        companyName: "Nelspruit Stationery & Printing",
        email: "print@nelspruitstationery.co.za",
        phone: "+27 13 752 4433",
        website: "https://nelspruitstationery.co.za",
        type: "SUPPLIER",
        role: "SUPPLIER",
        verified: true,
        onboardingComplete: true,
        province: "Mpumalanga",
        address: "22 Paul Kruger St, Nelspruit, Mbombela, 1200",
        industry: "Printing & Branding Services",
        preferredCategories: ["Supplies: Stationery/Printing", "Printing & Signage Services"],
        rating: 4.5,
        completedDeals: 13,
        registrationNumber: "2018/394829/07",
        taxClearance: "9384726102",
        createdAt: new Date().toISOString()
      },
      // Northern Cape
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
        uid: "supplier_upington_freight",
        id: "supplier_upington_freight",
        name: "Upington Freight Services",
        companyName: "Upington Freight Services",
        email: "logistics@upingtonfreight.co.za",
        phone: "+27 54 332 1199",
        website: "https://upingtonfreight.co.za",
        type: "SUPPLIER",
        role: "SUPPLIER",
        verified: true,
        onboardingComplete: true,
        province: "Northern Cape",
        address: "10 Le Roux St, Upington, 8801",
        industry: "Logistics & Transport",
        preferredCategories: ["Logistics", "Fuel"],
        rating: 4.6,
        completedDeals: 17,
        registrationNumber: "2015/394820/07",
        taxClearance: "9048372658",
        createdAt: new Date().toISOString()
      },
      // North West
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
      },
      {
        uid: "supplier_madikwe_textiles",
        id: "supplier_madikwe_textiles",
        name: "Madikwe Textiles & Garments",
        companyName: "Madikwe Textiles & Garments",
        email: "info@madikwetextiles.co.za",
        phone: "+27 18 381 4455",
        website: "https://madikwetextiles.co.za",
        type: "SUPPLIER",
        role: "SUPPLIER",
        verified: true,
        onboardingComplete: true,
        province: "North West",
        address: "88 Nelson Mandela Dr, Mafikeng, 2745",
        industry: "Manufacturing",
        preferredCategories: ["Textiles", "Office Supplies"],
        rating: 4.5,
        completedDeals: 11,
        registrationNumber: "2020/384920/07",
        taxClearance: "9283746104",
        createdAt: new Date().toISOString()
      }
    ];

    try {
        for (const s of suppliers) {
            await db.collection('users').doc(s.uid).set(s);
        }
        res.status(200).send("Seeded 18 suppliers successfully including faceprint.co.za in Gauteng!");
    } catch (err) {
        console.error("Seeding Error:", err);
        res.status(500).send("Error seeding suppliers: " + err.message);
    }
});

exports.requestOtp = onCall(async (request) => {
    const { phoneNumber } = request.data;
    if (!phoneNumber) throw new HttpsError('invalid-argument', 'Missing phone number');
    
    let formattedNumber = phoneNumber.replace(/\s+/g, '');
    if (formattedNumber.startsWith('0')) formattedNumber = '+27' + formattedNumber.substring(1);
    else if (!formattedNumber.startsWith('+')) formattedNumber = '+' + formattedNumber;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
    const attempts = 0;
    
    await db.collection('otps').doc(formattedNumber).set({
        code,
        expiresAt,
        attempts: 0
    });
    
    await sendSMS(formattedNumber, `Your ProcFin security code is: ${code}. Do not share this with anyone.`);
    
    return { success: true, message: 'OTP sent' };
});

exports.verifyOtp = onCall(async (request) => {
    const { phoneNumber, code } = request.data;
    if (!phoneNumber || !code) throw new HttpsError('invalid-argument', 'Missing phone or code');
    
    let formattedNumber = phoneNumber.replace(/\s+/g, '');
    if (formattedNumber.startsWith('0')) formattedNumber = '+27' + formattedNumber.substring(1);
    else if (!formattedNumber.startsWith('+')) formattedNumber = '+' + formattedNumber;

    const otpRef = db.collection('otps').doc(formattedNumber);
    const otpDoc = await otpRef.get();
    
    if (!otpDoc.exists) throw new HttpsError('not-found', 'OTP not found or expired');
    const otpData = otpDoc.data();
    
    // Block too many attempts
    if ((otpData.attempts || 0) >= 5) {
        await otpRef.delete();
        throw new HttpsError('resource-exhausted', 'Too many attempts. Please request a new OTP.');
    }

    if (Date.now() > otpData.expiresAt) {
        await otpRef.delete();
        throw new HttpsError('deadline-exceeded', 'OTP has expired. Please request a new one.');
    }
    
    if (otpData.code !== code) {
        // Increment attempts counter so we track wrong entries
        await otpRef.update({ attempts: (otpData.attempts || 0) + 1 });
        throw new HttpsError('unauthenticated', 'Incorrect OTP code. Please try again.');
    }
    
    // Get or Create Firebase User
    let userRecord;
    try {
        userRecord = await admin.auth().getUserByPhoneNumber(formattedNumber);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            userRecord = await admin.auth().createUser({
                phoneNumber: formattedNumber
            });
        } else {
            console.error('Error fetching user:', error);
            throw new HttpsError('internal', 'Error fetching user');
        }
    }
    
    // Create Custom Token
    let customToken;
    try {
        customToken = await admin.auth().createCustomToken(userRecord.uid);
    } catch (error) {
        console.error('Error creating custom token:', error);
        throw new HttpsError('internal', 'Error creating custom token: ' + error.message);
    }

    // Valid and Token generated! Delete OTP now.
    await otpRef.delete();
    
    return { token: customToken };
});

/**
 * checkPhone - Check if a phone number already has a ProcFin account.
 * Returns { exists: true/false }
 */
exports.checkPhone = onCall(async (request) => {
    const { phoneNumber } = request.data;
    if (!phoneNumber) throw new HttpsError('invalid-argument', 'Missing phone number');

    let formattedNumber = phoneNumber.replace(/\s+/g, '');
    if (formattedNumber.startsWith('0')) formattedNumber = '+27' + formattedNumber.substring(1);
    else if (!formattedNumber.startsWith('+')) formattedNumber = '+27' + formattedNumber;

    try {
        // Check Firebase Auth for the phone number
        await admin.auth().getUserByPhoneNumber(formattedNumber);
        return { exists: true };
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return { exists: false };
        }
        // Fallback: search Firestore users by phone field
        try {
            const usersSnap = await db.collection('users')
                .where('phone', '==', formattedNumber)
                .limit(1)
                .get();
            return { exists: !usersSnap.empty };
        } catch (e) {
            console.error('checkPhone Firestore fallback error:', e);
            return { exists: false };
        }
    }
});

/**
 * verifyPin - Verify a 5-digit PIN for a returning user and return a custom login token.
 * Tracks wrong attempts and locks after 5 failures.
 */
exports.verifyPin = onCall(async (request) => {
    const { phoneNumber, pin } = request.data;
    if (!phoneNumber || !pin) throw new HttpsError('invalid-argument', 'Missing phone or PIN');
    if (pin.length !== 5) throw new HttpsError('invalid-argument', 'PIN must be 5 digits');

    let formattedNumber = phoneNumber.replace(/\s+/g, '');
    if (formattedNumber.startsWith('0')) formattedNumber = '+27' + formattedNumber.substring(1);
    else if (!formattedNumber.startsWith('+')) formattedNumber = '+27' + formattedNumber;

    // Find the user by phone number in Firebase Auth
    let userRecord;
    try {
        userRecord = await admin.auth().getUserByPhoneNumber(formattedNumber);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            throw new HttpsError('not-found', 'No account found for this number. Please sign up first.');
        }
        throw new HttpsError('internal', 'Error looking up account');
    }

    // Fetch user profile from Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found. Please contact support.');
    }

    const userData = userDoc.data();

    // Check for lockout
    const now = Date.now();
    if (userData.pinLockedUntil && now < userData.pinLockedUntil) {
        const minutesLeft = Math.ceil((userData.pinLockedUntil - now) / 60000);
        throw new HttpsError('resource-exhausted', `Too many wrong attempts. Try again in ${minutesLeft} minute(s).`);
    }

    // Verify PIN
    const pinHash = Buffer.from(pin).toString('base64'); // btoa equivalent in Node
    if (userData.pinHash !== pinHash) {
        const wrongAttempts = (userData.pinWrongAttempts || 0) + 1;
        if (wrongAttempts >= 5) {
            // Lock for 15 minutes
            await userRef.update({
                pinWrongAttempts: wrongAttempts,
                pinLockedUntil: now + 15 * 60 * 1000
            });
            throw new HttpsError('resource-exhausted', 'Too many wrong attempts. Account locked for 15 minutes.');
        }
        await userRef.update({ pinWrongAttempts: wrongAttempts });
        const attemptsLeft = 5 - wrongAttempts;
        throw new HttpsError('unauthenticated', `Incorrect passcode. ${attemptsLeft} attempt(s) remaining.`);
    }

    // PIN correct — reset attempt counter and create token
    await userRef.update({ pinWrongAttempts: 0, pinLockedUntil: null });

    let customToken;
    try {
        customToken = await admin.auth().createCustomToken(userRecord.uid);
    } catch (error) {
        console.error('Error creating custom token:', error);
        throw new HttpsError('internal', 'Error creating login token: ' + error.message);
    }

    return { token: customToken };
});

exports.onNotificationAdded = onDocumentCreated("user_notifications/{userId}", async (event) => {
    const userId = event.params.userId;
    const snap = event.data;
    
    if (!snap) return null;
    const newData = snap.data();

    if (!newData || !newData.data || newData.data.length === 0) {
      return null;
    }

    // Get the latest notification from the array
    const notifications = newData.data;
    const latestNotification = notifications[0]; // Assuming prepended

    if (!latestNotification || !latestNotification.title) {
        return null;
    }

    // Fetch the user's FCM token from the users collection
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        console.log(`User ${userId} not found.`);
        return null;
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
        console.log(`User ${userId} does not have an FCM token registered.`);
        return null;
    }

    const payload = {
      notification: {
        title: latestNotification.title,
        body: latestNotification.message || 'You have a new notification on ProcFin.',
      },
      data: {
        type: latestNotification.type || 'info',
        link: latestNotification.link || '/'
      }
    };

    try {
      const response = await admin.messaging().sendToDevice(fcmToken, payload);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.log('Error sending message:', error);
    }
});

/**
 * syncTenders - Fetch live public sector tenders from the National Treasury OCDS API
 * and sync them to Firestore for matching and display.
 */
exports.syncTenders = onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    try {
        const limit = req.query.limit || 100;

        // Calculate default dates (dateFrom: 90 days ago, dateTo: today)
        const today = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);

        const formatDate = (d) => d.toISOString().split('T')[0];

        const dateFrom = req.query.dateFrom || formatDate(ninetyDaysAgo);
        const dateTo = req.query.dateTo || formatDate(today);

        const tendersSaved = [];
        const pagesToFetch = [1, 2, 3, 4, 5];

        console.log(`Starting parallel fetch of eTenders OCDS pages 1-5 from ${dateFrom} to ${dateTo}`);
        const fetchPromises = pagesToFetch.map(async (pageNum) => {
            const apiUrl = `https://ocds-api.etenders.gov.za/api/OCDSReleases?PageNumber=${pageNum}&PageSize=${limit}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
            try {
                const response = await axios.get(apiUrl, { timeout: 15000 });
                return response.data?.releases || [];
            } catch (err) {
                console.error(`Error fetching page ${pageNum} from eTenders API:`, err.message);
                return [];
            }
        });

        const allPageReleases = await Promise.all(fetchPromises);

        for (const releases of allPageReleases) {
            for (const release of releases) {
                const tender = release.tender;
                if (!tender) continue;

                // Map and normalize category
                let rawCategory = tender.mainProcurementCategory || tender.category || "General Supplies";
                
                // Map common abbreviations to official categories
                let category = rawCategory;
                if (category === "Stationery/Printing" || category === "Stationery") category = "Supplies: Stationery/Printing";
                else if (category === "IT" || category === "Computers") category = "Supplies: Computer Equipment";
                else if (category === "Clothing" || category === "Textiles") category = "Supplies: Clothing/Textiles/Footwear";
                else if (category === "Medical Supplies") category = "Supplies: Medical";

                const tenderData = {
                    id: release.ocid || release.id || `tender_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    title: tender.title || "Untitled Tender Opportunity",
                    description: tender.description || release.description || "No description provided.",
                    category: category,
                    rawCategory: rawCategory,
                    procuringEntity: tender.procuringEntity?.name || release.buyer?.name || "South African Government Institution",
                    amount: tender.value?.amount || 0,
                    currency: tender.value?.currency || "ZAR",
                    startDate: tender.tenderPeriod?.startDate || release.date || new Date().toISOString(),
                    endDate: tender.tenderPeriod?.endDate || new Date(Date.now() + 14*24*60*60*1000).toISOString(), // 14 days fallback
                    contactPerson: {
                        name: tender.contactPerson?.name || "Procurement Officer",
                        email: tender.contactPerson?.email || "tenders@etenders.gov.za",
                        phone: tender.contactPerson?.telephoneNumber || "N/A"
                    },
                    createdAt: new Date().toISOString()
                };

                // Save to Firestore using merge
                await db.collection('tenders').doc(tenderData.id).set(tenderData, { merge: true });
                tendersSaved.push(tenderData);
            }
        }

        res.status(200).json({
            success: true,
            message: `Synced ${tendersSaved.length} tenders successfully.`,
            tendersCount: tendersSaved.length,
            tenders: tendersSaved.slice(0, 5) // return a sample of 5
        });

    } catch (error) {
        console.error("Error in syncTenders main routine:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Failed to sync tenders from eTenders API."
        });
    }
});

/**
 * verifyCsd - Resolves and verifies a CSD Registration Number (MAAAXXXXXXX)
 * and returns verified supplier details and categories.
 */
exports.verifyCsd = onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    try {
        const csdNumber = (req.query.csdNumber || req.body.csdNumber || '').trim().toUpperCase();

        if (!csdNumber) {
            return res.status(400).json({
                success: false,
                error: "CSD Registration Number is required."
            });
        }

        // Validate format (e.g. MAAA1234567)
        const csdRegex = /^MAAA\d{7}$/;
        if (!csdRegex.test(csdNumber)) {
            return res.status(400).json({
                success: false,
                error: "Invalid CSD format. Must start with MAAA followed by 7 digits (e.g., MAAA1234567)."
            });
        }

        // Mock Database of verified CSD profiles
        const mockDatabase = {
            "MAAA0000001": {
                companyName: "FacePrint PTY Ltd",
                registrationNumber: "2018/482910/07",
                taxClearanceStatus: "Compliant",
                preferredCategories: ["Supplies: Stationery/Printing", "Printing & Signage Services"],
                contactPerson: "George Faceprint",
                address: "74 De Korte St, Braamfontein, Johannesburg, 2001",
                province: "Gauteng"
            },
            "MAAA0000002": {
                companyName: "Randburg Tech & Cables",
                registrationNumber: "2021/304859/07",
                taxClearanceStatus: "Compliant",
                preferredCategories: ["IT Hardware", "Consultancy"],
                contactPerson: "Thabo Kabelo",
                address: "155 Hendrik Verwoerd Dr, Randburg, 2194",
                province: "Gauteng"
            },
            "MAAA0000003": {
                companyName: "Cape Peninsula Logistics",
                registrationNumber: "2015/192837/07",
                taxClearanceStatus: "Compliant",
                preferredCategories: ["Logistics", "Fuel"],
                contactPerson: "Sarah van der Merwe",
                address: "12 Marine Dr, Paarden Eiland, Cape Town, 7405",
                province: "Western Cape"
            },
            "MAAA0000004": {
                companyName: "Table Mountain Printing & Paper",
                registrationNumber: "2019/128493/07",
                taxClearanceStatus: "Compliant",
                preferredCategories: ["Supplies: Stationery/Printing", "Printing & Signage Services"],
                contactPerson: "John Table",
                address: "85 Albert Rd, Woodstock, Cape Town, 7925",
                province: "Western Cape"
            },
            "MAAA0000005": {
                companyName: "Durban Industrial & Steel",
                registrationNumber: "2012/094832/07",
                taxClearanceStatus: "Compliant",
                preferredCategories: ["Construction Materials", "Industrial Tools"],
                contactPerson: "Devi Naidoo",
                address: "245 Umgeni Rd, Durban, 4001",
                province: "KwaZulu-Natal"
            }
        };

        let result = mockDatabase[csdNumber];

        // If not explicitly in mock database, auto-generate realistic data for testing
        if (!result) {
            const lastDigits = csdNumber.replace("MAAA", "");
            const mockNameOptions = ["Mzansi Supply & Trading", "Siyakhula Logistics", "Ekuseni Services", "Vulindlela Construction", "Ubuntu Office Supplies"];
            const mockIndustries = [
                ["Supplies: Stationery/Printing", "Printing & Signage Services"],
                ["Supplies: Computer Equipment", "IT Hardware"],
                ["Logistics", "Fuel"],
                ["Construction Materials", "Industrial Tools"],
                ["Professional Services", "Consultancy"]
            ];
            
            const index = parseInt(lastDigits) % mockNameOptions.length;
            
            result = {
                companyName: `${mockNameOptions[index]} (Pty) Ltd`,
                registrationNumber: `20${(20 + index)}/${100000 + parseInt(lastDigits) % 900000}/07`,
                taxClearanceStatus: "Compliant",
                preferredCategories: mockIndustries[index],
                contactPerson: "Supplier Representative",
                address: `${10 + index * 5} Main Road, Midrand, Johannesburg, 1685`,
                province: "Gauteng"
            };
        }

        return res.status(200).json({
            success: true,
            csdNumber: csdNumber,
            data: result
        });

    } catch (error) {
        console.error("Error in verifyCsd function:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Failed to verify CSD."
        });
    }
});


