const axios = require('axios');

async function run() {
    try {
        const verifyOtpUrl = 'https://us-central1-lambolimos.cloudfunctions.net/verifyOtp';
        console.log("Verifying NON-EXISTENT OTP via HTTP...");
        const res = await axios.post(verifyOtpUrl, { data: { phoneNumber: '+27999999999', code: '000000' } });
        console.log("Verify OTP Response:", res.data);
    } catch(e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
run();
