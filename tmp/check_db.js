const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    "https://viegyabgubbcfkxnwsga.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZWd5YWJndWJiY2ZreG53c2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI2NDI5OCwiZXhwIjoyMDg4ODQwMjk4fQ.G2-a8xrUtWeEtXUvYBV5lLRKT-KQQ3zz6NymhHHG-_I"
);

async function check() {
    const { data, error } = await supabase.from('users').select('welcome_sent').limit(1);
    if (error) {
        console.error("Error selecting welcome_sent:", error.message);
    } else {
        console.log("Column exists, data:", data);
    }
}

check();
