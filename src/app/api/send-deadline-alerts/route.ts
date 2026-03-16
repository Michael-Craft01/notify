import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from '@/utils/webpush'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorised(req: NextRequest) {
    if (process.env.NODE_ENV === 'development') return true
    return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

// ─────────────────────────────────────────────────────────────────────────────
// ADHD-Optimised Alert Windows
//
// Strategy:
//  • More touchpoints = less chance of forgetting
//  • Varied copy per window = avoids habituation (ADHD brains tune out repetition)
//  • Social proof / cohort pressure = effective motivator for ADHD
//  • Escalating urgency tone = matches natural dopamine-driven urgency response
//  • Short, punchy body text = ADHD brains process brevity better
//  • requireInteraction on final alerts = can't be dismissed without action
// ─────────────────────────────────────────────────────────────────────────────
const ALERT_WINDOWS = [
    {
        label: '7d',
        ms: 7 * 24 * 60 * 60 * 1000,
        urgency: 'normal' as const,
        title: (t: string, name: string) => `📅 ${name}, On Your Radar: "${t}"`,
        body: (t: string, cohortPct: number) =>
            `Due in 7 days${cohortPct > 0 ? ` · ${cohortPct}% of your cohort has already started` : ''}. Add it to your plan now.`,
    },
    {
        label: '3d',
        ms: 3 * 24 * 60 * 60 * 1000,
        urgency: 'normal' as const,
        title: (t: string, name: string) => `⏳ ${name}, 3 Days Left — "${t}"`,
        body: (t: string, cohortPct: number) =>
            cohortPct > 50
                ? `More than half your class is already on this. Don't let yourself fall behind.`
                : `Still 3 days — but they go fast. Open it, even for 5 minutes.`,
    },
    {
        label: '48h',
        ms: 48 * 60 * 60 * 1000,
        urgency: 'normal' as const,
        title: (t: string, name: string) => `🟡 ${name}, 48h Heads Up — "${t}"`,
        body: (t: string, cohortPct: number) =>
            cohortPct > 0
                ? `${cohortPct}% of your cohort have already finished this. Clock is ticking.`
                : `Two days. Seriously — start now, even a rough draft counts.`,
    },
    {
        label: '24h',
        ms: 24 * 60 * 60 * 1000,
        urgency: 'high' as const,
        title: (t: string, name: string) => `🔴 Tomorrow, ${name} — "${t}"`,
        body: (_t: string, cohortPct: number) =>
            cohortPct > 60
                ? `${cohortPct}% done. You can catch up — open it now.`
                : `Due tomorrow. No more "later." This is the moment.`,
    },
    {
        label: '12h',
        ms: 12 * 60 * 60 * 1000,
        urgency: 'high' as const,
        title: (t: string, name: string) => `⚡ ${name}, 12 Hours — "${t}"`,
        body: (_t: string, _cohortPct: number) =>
            `Half a day left. Brain, this is not a drill. Open it.`,
    },
    {
        label: '6h',
        ms: 6 * 60 * 60 * 1000,
        urgency: 'high' as const,
        title: (t: string, name: string) => `🚨 ${name}, 6h Left — "${t}"`,
        body: (_t: string, cohortPct: number) =>
            cohortPct > 0
                ? `${cohortPct}% of your cohort finished. You have 6 hours. Go.`
                : `6 hours. Do not wait for the "right time." Now is it.`,
    },
    {
        label: '2h',
        ms: 2 * 60 * 60 * 1000,
        urgency: 'critical' as const,
        title: (t: string, name: string) => `🔥 ${name}, "${t}" — 2h`,
        body: (_t: string, _cohortPct: number) =>
            `2 hours. Everything else can wait. Focus here now.`,
    },
    {
        label: '30m',
        ms: 30 * 60 * 1000,
        urgency: 'critical' as const,
        title: (t: string, name: string) => `💀 ${name}, 30 Minutes — "${t}"`,
        body: (_t: string, _cohortPct: number) =>
            `THIRTY MINUTES. Submit what you have. Done beats perfect.`,
    },
]

const TOLERANCE_MS = 30 * 60 * 1000 // ±30 min per window check

export async function GET(req: NextRequest) {
    if (!isAuthorised(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = Date.now()
    const nowTime = new Date(now)
    let totalSent = 0
    let totalPruned = 0
    const log: string[] = []

    const currentDay = nowTime.getDay()
    const tenMinsFromNow = new Date(now + 10 * 60 * 1000)
    const tenMinsTimeStr = tenMinsFromNow.toTimeString().slice(0, 5) // "HH:mm"
    const dateStr = nowTime.toISOString().split('T')[0]

    // Fetch all subscriptions with user program association
    const { data: subs, error: subErr } = await supabase
        .from('user_subscriptions')
        .select(`
            id, 
            subscription, 
            device_type,
            users (
                full_name,
                email,
                program_id
            )
        `)

    if (subErr || !subs?.length) {
        return NextResponse.json({ ok: true, sent: 0, reason: 'No subscriptions', subErr })
    }

    // ── 1. WARDEN SCHEDULE ALERTS (10m before class) ─────────────────────
    const { data: lectures } = await supabase
        .from('schedules')
        .select('*')
        .eq('day_of_week', currentDay)
        .gte('start_time', tenMinsTimeStr + ':00')
        .lte('start_time', tenMinsTimeStr + ':59')

    if (lectures?.length) {
        for (const lecture of lectures) {
            // Check for cancellation
            const { data: override } = await supabase
                .from('schedule_overrides')
                .select('is_cancelled')
                .eq('schedule_id', lecture.id)
                .eq('override_date', dateStr)
                .single()

            if (override?.is_cancelled) continue

            const scopedSubs = subs.filter((s: any) => s.users?.program_id === lecture.program_id)
            if (!scopedSubs.length) continue

            await Promise.allSettled(
                scopedSubs.map(async (row: any) => {
                    const firstName = (row.users?.full_name || row.users?.email?.split('@')[0] || 'there').split(' ')[0]
                    const payload = JSON.stringify({
                        title: `🎒 ${firstName}, Time to move!`,
                        body: `${lecture.module_name} starts in 10 mins @ ${lecture.venue || 'LT'}. Pack your bags.`,
                        url: '/',
                        urgency: 'high',
                    })
                    try {
                        await webpush.sendNotification(row.subscription, payload)
                        totalSent++
                    } catch (err: any) {
                        if (err?.statusCode === 410 || err?.statusCode === 404) {
                            await supabase.from('user_subscriptions').delete().eq('id', row.id)
                            totalPruned++
                        }
                    }
                })
            )
            log.push(`[warden] "${lecture.module_name}" → ${scopedSubs.length} subs`)
        }
    }

    // ── 2. ASSIGNMENT DEADLINE ALERTS ─────────────────────────────────────
    for (const window of ALERT_WINDOWS) {
        const windowStart = new Date(now + window.ms - TOLERANCE_MS).toISOString()
        const windowEnd   = new Date(now + window.ms + TOLERANCE_MS).toISOString()

        const { data: assignments } = await supabase
            .from('assignments')
            .select('id, title, resource_url, task_type, program_id')
            .gte('due_date', windowStart)
            .lte('due_date', windowEnd)

        if (!assignments?.length) continue

        for (const assignment of assignments) {
            // Filter subscriptions to only those in the same program
            const scopedSubs = subs.filter((s: any) => s.users?.program_id === assignment.program_id)
            if (!scopedSubs.length) continue
            // Fetch cohort completion % for social proof messaging
            const { data: pulse } = await supabase
                .from('assignment_pulse_stats')
                .select('finished_percentage')
                .eq('assignment_id', assignment.id)
                .single()

            const cohortPct = pulse?.finished_percentage ?? 0
            const toDelete: string[] = []

            await Promise.allSettled(
                scopedSubs.map(async (row: any) => {
                    // ADHD-Resilient Origin Filtering
                    // In migration from vercel.app -> logichq.tech, allow both to ensure alerts aren't dropped.
                    const subOrigin = row.device_type?.split('browser:')[1]
                    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'notify.logichq.tech'
                    
                    if (siteUrl && subOrigin) {
                        const isLegacyOrigin = subOrigin.includes('vercel.app')
                        const isMainOrigin = subOrigin.includes('logichq.tech')
                        
                        if (!isLegacyOrigin && !isMainOrigin && !subOrigin.includes(siteUrl)) {
                            console.log(`[cron] Filtering out unknown origin: ${subOrigin}`)
                            return 
                        }
                    }

                    // Personalization Fallbacks
                    const fullName = row.users?.full_name || row.users?.email?.split('@')[0] || 'there'
                    const firstName = fullName.split(' ')[0]

                    const payload = JSON.stringify({
                        title: window.title(assignment.title, firstName),
                        body: window.body(assignment.title, cohortPct),
                        url: assignment.resource_url || '/',
                        urgency: window.urgency,
                    })

                    try {
                        totalSent++
                    } catch (err: any) {
                        if (err?.statusCode === 410 || err?.statusCode === 404) {
                            if (!toDelete.includes(row.id)) toDelete.push(row.id)
                            totalPruned++
                        }
                    }
                })
            )

            if (toDelete.length) {
                await supabase.from('user_subscriptions').delete().in('id', toDelete)
            }

            log.push(`[${window.label}] "${assignment.title}" → ${subs.length - toDelete.length} subs`)
        }
    }

    console.log(`[cron/adhd] sent=${totalSent} pruned=${totalPruned}`, log)
    return NextResponse.json({ ok: true, sent: totalSent, pruned: totalPruned, log })
}
