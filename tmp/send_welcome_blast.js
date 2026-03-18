const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
    "https://viegyabgubbcfkxnwsga.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZWd5YWJndWJiY2ZreG53c2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI2NDI5OCwiZXhwIjoyMDg4ODQwMjk4fQ.G2-a8xrUtWeEtXUvYBV5lLRKT-KQQ3zz6NymhHHG-_I"
);

const resend = new Resend("re_f9SrNNUz_MQ2GXFVNmxaxxSnY8P8532hr");

async function runBlast() {
    console.log("🚀 Starting Welcome Email Blast...");
    const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('welcome_sent', false);

    if (error) {
        console.error("❌ Supabase Error:", error.message);
        return;
    }

    if (!users || users.length === 0) {
        console.log("✅ No pending welcome emails.");
        return;
    }

    console.log(`📦 Found ${users.length} users to welcome.`);

    for (const user of users) {
        if (!user.email) continue;
        const firstName = (user.full_name || user.email.split('@')[0] || 'there').split(' ')[0];

        try {
            console.log(`✉️ Sending to ${firstName} (${user.email})...`);
            
            // We use a simplified text version for the blast since we can't easily render React Email in a pure node script without complex setup
            const { data, error: sendError } = await resend.emails.send({
                from: 'onboarding@logichq.tech',
                to: [user.email],
                subject: `Welcome to Notify, ${firstName}! 🧡`,
                text: `Hey ${firstName},\n\nYou're now part of the Computer Science 2028 alert system. We're here to make sure you never miss a lecture, a break, or a deadline.\n\nEnable Alerts: https://notify.logichq.tech\n\n- The Notify Team`,
            });

            if (sendError) {
                console.error(`  ❌ Failed for ${user.email}:`, sendError);
            } else {
                console.log(`  ✅ Sent! ID: ${data.id}`);
                // Update the flag so we don't double send later
                await supabase.from('users').update({ welcome_sent: true }).eq('id', user.id);
            }
        } catch (err) {
            console.error(`  ⚠️ Exception for ${user.email}:`, err.message);
        }
    }
    console.log("🏁 Blast complete.");
}

runBlast();
