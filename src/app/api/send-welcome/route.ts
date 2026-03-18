import { sendWelcomeEmail } from '@/utils/emails';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all users who haven't received the welcome email yet
    const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('welcome_sent', false);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
        return NextResponse.json({ message: 'No pending welcome emails' });
    }

    const results = [];

    for (const user of users) {
        if (!user.email) continue;
        
        const firstName = (user.full_name || user.email.split('@')[0] || 'there').split(' ')[0];

        try {
            const emailRes = await sendWelcomeEmail(user.email, firstName);

            if (emailRes.success) {
                await supabase.from('users').update({ welcome_sent: true }).eq('id', user.id);
                results.push({ email: user.email, status: 'sent', id: emailRes.id });
            } else {
                results.push({ email: user.email, status: 'error', error: emailRes.error });
            }
        } catch (err: any) {
            results.push({ email: user.email, status: 'exception', error: err.message });
        }
    }

    return NextResponse.json({ 
        total_pending: users.length, 
        processed: results.length,
        results 
    });
}
