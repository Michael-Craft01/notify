const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
    "https://viegyabgubbcfkxnwsga.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZWd5YWJndWJiY2ZreG53c2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI2NDI5OCwiZXhwIjoyMDg4ODQwMjk4fQ.G2-a8xrUtWeEtXUvYBV5lLRKT-KQQ3zz6NymhHHG-_I"
);

const resend = new Resend("re_f9SrNNUz_MQ2GXFVNmxaxxSnY8P8532hr");

async function debug() {
    console.log("Checking pending users...");
    const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('welcome_sent', false);

    if (error) {
        console.error("Supabase Error:", error.message);
        return;
    }

    console.log(`Found ${users?.length || 0} pending users.`);
    if (!users || users.length === 0) return;

    for (const user of users) {
        console.log(`Sending to ${user.email}...`);
        // We won't actually send in the debug check, just verify we can fetch and the state
    }
}

debug();
