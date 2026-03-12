import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
    const report: Record<string, any> = {}

    // 1. Check env vars
    report.vapid_public = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    report.vapid_private = !!process.env.VAPID_PRIVATE_KEY
    report.supabase_url = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    report.service_role_key = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!report.vapid_public || !report.vapid_private) {
        return NextResponse.json({ error: 'Missing VAPID keys', report }, { status: 500 })
    }

    // 2. Check how many subscriptions exist
    const { data: subs, error: subErr } = await supabase
        .from('user_subscriptions')
        .select('id, user_id, subscription')

    report.subscriptions_found = subs?.length ?? 0
    report.subscriptions_error = subErr?.message ?? null

    if (!subs?.length) {
        return NextResponse.json({
            error: 'No subscriptions found in the database. Make sure you clicked "Enable Alerts" and your browser granted permission.',
            report
        }, { status: 200 })
    }

    // 3. Try sending a real push to each subscription
    webpush.setVapidDetails(
        'mailto:admin@notifyapp.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
    )

    const results: { id: string; ok: boolean; error?: string }[] = []
    const toDelete: string[] = []

    for (const row of subs) {
        try {
            await webpush.sendNotification(
                row.subscription,
                JSON.stringify({
                    title: '🔔 Test Notification',
                    body: 'Notify push alerts are working correctly.',
                    url: '/',
                    urgency: 'normal',
                })
            )
            results.push({ id: row.id, ok: true })
        } catch (err: any) {
            results.push({ id: row.id, ok: false, error: `Status ${err?.statusCode}: ${err?.body}` })
            if (err?.statusCode === 410 || err?.statusCode === 404) {
                toDelete.push(row.id)
            }
        }
    }

    // Prune dead subscriptions
    if (toDelete.length) {
        await supabase.from('user_subscriptions').delete().in('id', toDelete)
    }

    report.push_results = results
    report.pruned = toDelete.length
    report.sent = results.filter(r => r.ok).length

    return NextResponse.json(report)
}
