const axios = require('axios');

async function testApi() {
    const urls = [
        'https://ocds-api.etenders.gov.za/api/OCDSReleases',
        'https://ocds-api.etenders.gov.za/api/OCDSReleases?PageNumber=1&PageSize=5',
        'https://ocds-api.etenders.gov.za/api/OCDSReleases?PageNumber=1&PageSize=5&dateFrom=2026-01-01&dateTo=2026-03-31',
        'https://ocds-api.etenders.gov.za/api/OCDSReleases?PageNumber=1&PageSize=5&dateFrom=2024-01-01&dateTo=2024-03-31',
    ];

    for (const url of urls) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await axios.get(url, { timeout: 10000 });
            console.log(`  Status: ${res.status}`);
            console.log(`  Releases count: ${res.data?.releases?.length}`);
            if (res.data?.releases?.length > 0) {
                console.log(`  First release keys:`, Object.keys(res.data.releases[0]));
                console.log(`  Tender Title:`, res.data.releases[0].tender?.title);
            }
        } catch (err) {
            console.log(`  Error: ${err.message}`);
            if (err.response) {
                console.log(`    Status: ${err.response.status}`);
                console.log(`    Data:`, JSON.stringify(err.response.data));
            }
        }
    }
}

testApi();
