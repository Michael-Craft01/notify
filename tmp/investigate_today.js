const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    "https://viegyabgubbcfkxnwsga.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZWd5YWJndWJiY2ZreG53c2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI2NDI5OCwiZXhwIjoyMDg4ODQwMjk4fQ.G2-a8xrUtWeEtXUvYBV5lLRKT-KQQ3zz6NymhHHG-_I"
);

async function checkToday() {
    const today = new Date('2026-03-18');
    const dayIndex = today.getDay(); // 3 for Wednesday
    
    console.log(`Checking for day index: ${dayIndex} (Wednesday)`);
    
    // Check lectures
    const { data: lectures, error: lecErr } = await supabase
        .from('schedules')
        .select('*')
        .eq('day_of_week', dayIndex);
        
    if (lecErr) console.error("Lecture Error:", lecErr);
    else {
        console.log(`Found ${lectures.length} lectures for today.`);
        lectures.forEach(l => console.log(`- ${l.module_name} at ${l.start_time}`));
    }

    // Check assignments
    const { data: assignments, error: assErr } = await supabase
        .from('assignments')
        .select('*')
        .gte('due_date', '2026-03-18T00:00:00Z')
        .lte('due_date', '2026-03-18T23:59:59Z');
        
    if (assErr) console.error("Assignment Error:", assErr);
    else console.log(`Found ${assignments.length} assignments due today.`);
}

checkToday();
