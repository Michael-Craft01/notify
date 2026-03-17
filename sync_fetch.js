
const fs = require('fs');

async function sync() {
    const url = 'https://viegyabgubbcfkxnwsga.supabase.co/rest/v1/schedules';
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZWd5YWJndWJiY2ZreG53c2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI2NDI5OCwiZXhwIjoyMDg4ODQwMjk4fQ.G2-a8xrUtWeEtXUvYBV5lLRKT-KQQ3zz6NymhHHG-_I';
    const data = JSON.parse(fs.readFileSync('sc_data.json', 'utf8'));

    console.log(`Sending ${data.length} records to Supabase...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('Sync Successful!');
        } else {
            const errText = await response.text();
            console.error(`Sync Failed: ${response.status} ${response.statusText}`);
            console.error(errText);
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

sync();
