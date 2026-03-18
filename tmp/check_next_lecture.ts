import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const todayName = days[now.getDay()];
    console.log(`Current Time (local): ${now.toLocaleTimeString()}`);
    console.log(`Today is: ${todayName}`);

    const { data: users, error: userError } = await supabase.from('users').select('*').limit(5);
    if (userError) console.error(userError);
    if (!users || users.length === 0) { console.log('No users.'); return; }
    const user = users[0];
    
    const { data: todayClasses, error } = await supabase
        .from('timetables')
        .select('*')
        .eq('program_id', user.program_id)
        .eq('day_of_week', todayName)
        .order('start_time');
        
    if (error) { console.error(error); return; }
    console.log('\n--- TODAY CLASSES ---');
    console.table(todayClasses?.map(c => ({ module: c.module_name, start: c.start_time, end: c.end_time })));
}

main().catch(console.error);
