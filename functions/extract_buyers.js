const fs = require('fs');
const path = require('path');

const filePath = '/Users/afriwalletg/.gemini/antigravity-ide/brain/ef1ec052-e1fe-493e-90a5-005a351c5782/.system_generated/steps/3908/content.md';
const content = fs.readFileSync(filePath, 'utf-8');

const regex = /<option value="\d+">([^<]+)<\/option>/g;
let match;
const buyers = [];

while ((match = regex.exec(content)) !== null) {
    // Decode HTML entities just in case (like &#xE9; or &amp;)
    let name = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&#xE9;/g, 'é')
        .replace(/&#x2013;/g, '–')
        .replace(/&#xD;&#xA;/g, ' ')
        .trim();
    if (name && !buyers.includes(name)) {
        buyers.push(name);
    }
}

// Sort alphabetically
buyers.sort();

console.log(`Extracted ${buyers.length} unique buyers.`);

const outputPath = '/Users/afriwalletg/Downloads/new anttograv/Vuvu Funding/procfin-react/src/constants/buyers.js';
const fileContent = `// Official South African Government Procuring Entities / Buyers
// Source: SA National Treasury eTenders Portal
// Total: ${buyers.length} verified public institutions

export const PROCURING_ENTITIES = ${JSON.stringify(buyers, null, 4)};
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`Saved to ${outputPath}`);
