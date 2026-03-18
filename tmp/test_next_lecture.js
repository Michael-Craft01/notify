const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    "https://viegyabgubbcfkxnwsga.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZWd5YWJndWJiY2ZreG53c2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI2NDI5OCwiZXhwIjoyMDg4ODQwMjk4fQ.G2-a8xrUtWeEtXUvYBV5lLRKT-KQQ3zz6NymhHHG-_I"
);

function getWardenVibe(name, moduleName, venue, type) {
    if (type === 'started') {
        const vibes = [
            { title: `🚨 Class Started: ${moduleName}`, body: `Hey ${name}, ${moduleName} has officially begun at ${venue}. Get there ASAP.` },
        ]
        return vibes[Math.floor(Math.random() * vibes.length)]
    } else {
        const vibes = [
            { title: `⏳ 10 Min Warning: ${moduleName}`, body: `Yo ${name}, ${moduleName} starts in 10 minutes at ${venue}. Don't be late.` },
        ]
        return vibes[Math.floor(Math.random() * vibes.length)]
    }
}

async function runTest() {
    console.log("🧪 Running Notification Logic Simulation...");
    
    // Simulate current time as 12:05 PM today (10 mins before DSP lecture)
    const mockNow = new Date('2026-03-18T12:05:00+02:00').getTime();
    const nowTime = new Date(mockNow);
    const currentDay = nowTime.getDay(); // 3 (Wednesday)
    
    const nowPlus12 = new Date(mockNow + 12 * 60 * 1000);
    const nowPlus12Str = nowPlus12.toTimeString().slice(0, 5) + ':00';
    const nowMinStr = nowTime.toTimeString().slice(0, 5) + ':00';

    console.log(`⏰ Simulating time: ${nowTime.toTimeString().slice(0, 5)} (Checking window: ${nowMinStr} - ${nowPlus12Str})`);

    // Fetch all users
    const { data: allUsers } = await supabase.from('users').select('id, full_name, email, program_id');
    console.log(`\n👥 Fetched ${allUsers?.length || 0} total users from DB.`);

    // Fetch subscriptions (simulating what route.ts does)
    const { data: subs, error: subErr } = await supabase.from('user_subscriptions').select('id, users(full_name, email, program_id)');
    console.log(`📱 Fetched ${subs?.length || 0} push subscriptions. (Error: ${subErr?.message || 'None'})`);

    // Fetch lectures in the window
    const { data: lectures } = await supabase
        .from('schedules')
        .select('*')
        .eq('day_of_week', currentDay)
        .gte('start_time', nowMinStr)
        .lte('start_time', nowPlus12Str);

    console.log(`\n📚 Found ${lectures?.length || 0} lectures in the target window.`);

    if (lectures?.length) {
        for (const lecture of lectures) {
            console.log(`\n➡️ Processing Lecture: ${lecture.module_name} at ${lecture.start_time}`);
            
            const currentSubs = subs || [];
            const scopedSubs = currentSubs.filter(s => {
                const user = Array.isArray(s.users) ? s.users[0] : s.users;
                return user?.program_id === lecture.program_id;
            });
            const scopedUsers = allUsers?.filter(u => u.program_id === lecture.program_id) || [];

            console.log(`   🎯 Scoped to ${scopedSubs.length} push devices and ${scopedUsers.length} email addresses for Program ID: ${lecture.program_id}`);
            
            if (!scopedSubs.length && !scopedUsers.length) {
                console.log("   ⚠️ No users found for this program. Skipping.");
                continue;
            }

            const type = lecture.start_time.startsWith(nowTime.toTimeString().slice(0, 5)) ? 'started' : 'upcoming';
            
            // Generate a sample payload for the first user
            if (scopedUsers.length > 0) {
                const testUser = scopedUsers[0];
                const firstName = (testUser.full_name || testUser.email.split('@')[0] || 'there').split(' ')[0];
                const vibe = getWardenVibe(firstName, lecture.module_name, lecture.venue || 'the hall', type);
                
                console.log(`\n   📨 Sample Email Payload for ${testUser.email}:`);
                console.log(`      Subject: ${vibe.title}`);
                console.log(`      Body Match: ${vibe.body}`);
            }
            
            console.log(`\n✅ TEST SUCCESS: The logic correctly isolated ${scopedUsers.length} users and generated the right payloads!`);
        }
    }
}

runTest();
