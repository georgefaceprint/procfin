const { requestOtp, verifyOtp } = require('./index');
const admin = require('firebase-admin');

async function test() {
    try {
        const req = { data: { phoneNumber: '+27659863624' } };
        console.log("Requesting OTP...");
        const res = await requestOtp.run(req);
        console.log(res);
        
        // Let's directly check if it exists in db
        const db = admin.firestore(); // Wait, we need the procfin DB
        const { getFirestore } = require('firebase-admin/firestore');
        const procfinDb = getFirestore(undefined, 'procfin');
        const doc = await procfinDb.collection('otps').doc('+27659863624').get();
        console.log("Exists in procfin DB? ", doc.exists);
        if (doc.exists) console.log(doc.data());
    } catch(e) {
        console.error(e);
    }
}
// We cannot run this locally because we lack ADC.
