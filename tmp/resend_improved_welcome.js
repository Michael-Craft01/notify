const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
    "https://viegyabgubbcfkxnwsga.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZWd5YWJndWJiY2ZreG53c2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI2NDI5OCwiZXhwIjoyMDg4ODQwMjk4fQ.G2-a8xrUtWeEtXUvYBV5lLRKT-KQQ3zz6NymhHHG-_I"
);

const resend = new Resend("re_f9SrNNUz_MQ2GXFVNmxaxxSnY8P8532hr");

async function runImprovedBlast() {
    console.log("🚀 Starting Improved Welcome Email Blast (Re-send)...");
    
    // Fetch all users to ensure everyone gets the new premium version
    const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email');

    if (error) {
        console.error("❌ Supabase Error:", error.message);
        return;
    }

    if (!users || users.length === 0) {
        console.log("❓ No users found in database.");
        return;
    }

    console.log(`📦 Found ${users.length} users. Sending the improved message...`);

    for (const user of users) {
        if (!user.email) continue;
        const firstName = (user.full_name || user.email.split('@')[0] || 'there').split(' ')[0];

        try {
            console.log(`✉️ Sending improved version to ${firstName} (${user.email})...`);
            
            const { data, error: sendError } = await resend.emails.send({
                from: 'onboarding@logichq.tech',
                to: [user.email],
                subject: `You're in, ${firstName}! Welcome to Notify 🧡`,
                text: `Hey ${firstName},\n\nYou're officially part of the Notify family. 🍊\n\nWe didn't just build Notify for everyone—we built it for you. In the fast-paced world of Computer Science 2028, we know that every second counts. That's why we're here: to take the stress of scheduling off your shoulders.\n\nThink of Notify as your personal academic strategist. Whether it's a timely 10-minute heads-up for a lecture or a motivational nudge for a deadline, we've got your back, every step of the way.\n\nYour New Superpowers:\n1. The Warden: Instant alerts that find you 10 minutes before class starts.\n2. Daily Hype: A morning briefing to help you own your day before it even begins.\n3. Social Pulse: See how the rest of the cohort is faring with assignments so you never feel alone.\n\nTo experience the full magic, make sure to enable push notifications. It's how we transition from "staying informed" to "staying ahead."\n\nGo to My Dashboard: https://notify.logichq.tech\n\n- The Notify Team`,
            });

            if (sendError) {
                console.error(`  ❌ Failed for ${user.email}:`, sendError);
            } else {
                console.log(`  ✅ Sent! ID: ${data.id}`);
                // Ensure the flag is set (for consistency)
                await supabase.from('users').update({ welcome_sent: true }).eq('id', user.id);
            }
        } catch (err) {
            console.error(`  ⚠️ Exception for ${user.email}:`, err.message);
        }
    }
    console.log("🏁 Improved blast complete.");
}

runImprovedBlast();
