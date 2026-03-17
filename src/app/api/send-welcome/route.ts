import { Resend } from 'resend';
import { WelcomeNudgeEmail } from '@/emails/WelcomeNudge';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const resend = new Resend(process.env.RESEND_API_Key);
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all users with their full name and email
    const { data: users, error } = await supabase
        .from('users')
        .select('full_name, email');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
        return NextResponse.json({ message: 'No users found' });
    }

    const results = [];

    for (const user of users) {
        if (!user.email) continue;
        
        const firstName = (user.full_name || user.email.split('@')[0] || 'there').split(' ')[0];

        try {
            const { data, error: sendError } = await resend.emails.send({
                from: 'onboarding@notify.logichq.tech',
                to: [user.email],
                subject: `Welcome to Notify, ${firstName}! 🧡`,
                react: WelcomeNudgeEmail({ firstName }),
            });

            if (sendError) {
                results.push({ email: user.email, status: 'error', error: sendError });
            } else {
                results.push({ email: user.email, status: 'sent', id: data?.id });
            }
        } catch (err: any) {
            results.push({ email: user.email, status: 'exception', error: err.message });
        }
    }

    return NextResponse.json({ 
        total: users.length, 
        processed: results.length,
        results 
    });
}
