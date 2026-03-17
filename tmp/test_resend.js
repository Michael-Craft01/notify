const { Resend } = require('resend');
require('dotenv').config({ path: 'c:/Users/ragum/Music/notify/.env' });

const resend = new Resend(process.env.Resend_API_Key);

async function test() {
    console.log("Using API Key:", process.env.Resend_API_Key ? "Found" : "Missing");
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'raguma.mchael@gmail.com', // Using user's email from logs if possible, or a placeholder
            subject: 'Test from Notify Script',
            html: '<p>If you see this, Resend is working!</p>'
        });
        if (error) {
            console.error("Resend Error:", error);
        } else {
            console.log("Resend Success:", data);
        }
    } catch (e) {
        console.error("Exception:", e.message);
    }
}

test();
