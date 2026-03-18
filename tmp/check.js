const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)[1].replace(/["']/g, '').trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/)[1].replace(/["']/g, '').trim();

const now = new Date();
const currentDayName = now.toLocaleString('en-US', { weekday: 'long' });

console.log(`Current local time: ${now.toLocaleTimeString('en-US', { hour12: false })}`);

fetch(`${url}/rest/v1/schedules?select=module_name,start_time,end_time&day_of_week=eq.${currentDayName}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
})
.then(r => r.json())
.then(data => {
    console.log(`\n--- SCHEDULE FOR TODAY: ${currentDayName} ---`);
    if (!data || data.length === 0) {
        console.log("No lectures found for today.");
    } else {
        data.sort((a,b) => a.start_time.localeCompare(b.start_time));
        console.table(data);
    }
})
.catch(console.error);
