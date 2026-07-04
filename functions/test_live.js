const axios = require('axios');

async function run() {
    try {
        const reqOtpUrl = 'https://us-central1-lambolimos.cloudfunctions.net/requestOtp';
        console.log("Requesting OTP via HTTP...");
        const res = await axios.post(reqOtpUrl, { data: { phoneNumber: '+27659863624' } });
        console.log("Request OTP Response:", res.data);
    } catch(e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
run();
