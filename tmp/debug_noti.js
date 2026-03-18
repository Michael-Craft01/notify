const fs = require('fs');
const e = fs.readFileSync('.env', 'utf-8');
const u = e.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)[1].replace(/['"]/g, '').trim();
const k = e.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/)[1].replace(/['"]/g, '').trim();

async function check() {
    // 1. Get user info (Assuming the user is the one we care about, probably the first one in this dev context)
    const usersRes = await fetch(u + '/rest/v1/users?select=id,full_name,program_id', {
        headers: { 'apikey': k, 'Authorization': 'Bearer ' + k }
    });
    const users = await usersRes.json();
    console.log("Users:", JSON.stringify(users, null, 2));

    // 2. Get subscriptions
    const subsRes = await fetch(u + '/rest/v1/user_subscriptions?select=user_id,device_type', {
        headers: { 'apikey': k, 'Authorization': 'Bearer ' + k }
    });
    const subs = await subsRes.json();
    console.log("Subscriptions:", JSON.stringify(subs, null, 2));

    // 3. Get Wednesday schedules
    const schedRes = await fetch(u + '/rest/v1/schedules?day_of_week=eq.3', {
        headers: { 'apikey': k, 'Authorization': 'Bearer ' + k }
    });
    const scheds = await schedRes.json();
    console.log("Wednesday Schedule:", JSON.stringify(scheds, null, 2));
}

check();
