const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure the email transport using the default SMTP transport and a Gmail account/App Password.
// For production, using SendGrid or Mailgun is recommended.
const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.onUserVerified = functions.firestore.document('users/{userId}')
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

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
            } catch (error) {
                console.error('Error sending verification email:', error);
            }
        } else {
            console.log('User was updated but verification status did not change to true.');
        }

        return null;
    });

exports.onDealCreated = functions.firestore.document('deals/{dealId}')
    .onCreate(async (snap, context) => {
        const deal = snap.data();
        const smeId = deal.smeId;

        // Fetch SME email from users collection
        const smeSnap = await admin.firestore().collection('users').doc(smeId).get();
        if (!smeSnap.exists()) return null;
        const smeEmail = smeSnap.data().email;
        const smeName = smeSnap.data().name || 'User';

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
        } catch (error) {
            console.error('Error sending funding request email:', error);
        }
        return null;
    });

exports.onRfqAccepted = functions.firestore.document('rfqs/{rfqId}')
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // Trigger when status changes to 'Closed (Quote Accepted)'
        if (newValue.status === 'Closed (Quote Accepted)' && previousValue.status !== 'Closed (Quote Accepted)') {
            const smeId = newValue.smeId;
            const smeSnap = await admin.firestore().collection('users').doc(smeId).get();
            if (!smeSnap.exists()) return null;
            const smeEmail = smeSnap.data().email;
            const smeName = smeSnap.data().name || 'User';
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
            } catch (error) {
                console.error('Error sending RFQ acceptance email:', error);
            }
        }
        return null;
    });

exports.testEmailSystem = functions.https.onCall(async (data, context) => {
    const mailOptions = {
        from: '"ProcFin System" <noreply@procfin.co.za>',
        to: 'faceprint@icloud.com',
        subject: 'ProcFin - SMTP System Diagnosis 🧪',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #ddd; border-radius: 10px;">
        <h3 style="color: #6366f1;">SMTP System Diagnosis 🧪</h3>
        <p>This is a manual diagnostic email to verify the SMTP transport is functioning correctly.</p>
        <p><strong>Environment:</strong> Firebase Cloud Functions</p>
        <p><strong>Sender:</strong> ${process.env.EMAIL_USER}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <br/>
        <p style="background: #f3f4f6; padding: 10px; border-radius: 5px; font-size: 12px; color: #666;">
          If you received this email, the SMTP configuration and Cloud Functions are live.
        </p>
        <p>Best Regards,</p>
        <p><strong>The ProcFin Engine</strong></p>
      </div>
    `
    };

    try {
        await mailTransport.sendMail(mailOptions);
        return { success: true, message: 'Diagnosis email sent to faceprint@icloud.com' };
    } catch (error) {
        console.error('SMTP Diagnosis Error:', error);
        throw new functions.https.HttpsError('internal', `Failed to send diagnosis email: ${error.message}`);
    }
});
