// Simulate phone number formatting on both sides
function formatPhone(phone) {
    let formatted = phone.trim();
    if (formatted.startsWith('0')) formatted = '+27' + formatted.substring(1);
    else if (!formatted.startsWith('+')) formatted = '+27' + formatted;
    return formatted;
}

// What the frontend sends
const frontendInput = '0659863624';
const frontendFormatted = formatPhone(frontendInput);
console.log("Frontend sends:", frontendFormatted);

// What the backend stores (requestOtp)
function backendFormat(phone) {
    let f = phone.replace(/\s+/g, '');
    if (f.startsWith('0')) f = '+27' + f.substring(1);
    else if (!f.startsWith('+')) f = '+' + f;
    return f;
}

// If frontend sends already-formatted number
const backendReceived = '+27659863624';
const backendStored = backendFormat(backendReceived);
console.log("Backend stores doc ID:", backendStored);

// On verify, same input
const verifyReceived = '+27659863624';
const verifyFormatted = backendFormat(verifyReceived);
console.log("Backend looks up doc:", verifyFormatted);

console.log("Match?", backendStored === verifyFormatted);
