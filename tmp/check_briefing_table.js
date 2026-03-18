const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    "https://viegyabgubbcfkxnwsga.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZWd5YWJndWJiY2ZreG53c2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI2NDI5OCwiZXhwIjoyMDg4ODQwMjk4fQ.G2-a8xrUtWeEtXUvYBV5lLRKT-KQQ3zz6NymhHHG-_I"
);

async function checkTable() {
    const { data, error } = await supabase.from('briefing_logs').select('id').limit(1);
    if (error) {
        console.error("Table Error:", error.message);
    } else {
        console.log("Table exists.");
    }
}

checkTable();
