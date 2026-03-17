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
        title: (t: string, name: string) => `📅 On your radar, ${name}`,
        body: (t: string, pct: number) => `"${t}" is due in a week. ${pct > 0 ? `${pct}% of your cohort is already on it.` : "Just a soft nudge."}`,
    },
    {
        label: '3d',
        ms: 3 * 24 * 60 * 60 * 1000,
        urgency: 'normal' as const,
        title: (t: string, name: string) => `⏳ ${name}, 3 Days Left`,
        body: (t: string, pct: number) => `"${t}" is coming up. Open it today, even for 5 minutes.`,
    },
    {
        label: '48h',
        ms: 48 * 60 * 60 * 1000,
        urgency: 'high' as const,
        title: (t: string, name: string) => `🕒 48 Hours, ${name}`,
        body: (t: string, pct: number) => `"${t}" deadline is in 2 days. Time to plan your final push!`,
    },
    {
        label: '39.5h',
        ms: 39.5 * 60 * 60 * 1000,
        urgency: 'high' as const,
        title: (t: string, name: string) => `🔔 Verification: ${name}`,
        body: (t: string, pct: number) => `Triggering alert for "${t}" via test window.`,
    },
    {
        label: '24h',
        ms: 24 * 60 * 60 * 1000,
        urgency: 'high' as const,
        title: (t: string, name: string) => `⚡ Tomorrow, ${name}`,
        body: (t: string, pct: number) => `"${t}" deadline is tomorrow. This is the moment to lock in.`,
    },
    {
        label: '12h',
        ms: 12 * 60 * 60 * 1000,
        urgency: 'high' as const,
        title: (t: string, name: string) => `⚠️ ${name}, 12h Left`,
        body: (t: string, pct: number) => `"${t}" is due in 12 hours. Wrap up those final details.`,
    },
    {
        label: '2h',
        ms: 2 * 60 * 60 * 1000,
        urgency: 'critical' as const,
        title: (t: string, name: string) => `🔥 ${name}, Finish Strong!`,
        body: (t: string, pct: number) => `2 hours until "${t}" is due. Everything else can wait.`,
    },
]

const TOLERANCE_MS = 60 * 60 * 1000 // ±60 min per window check

// ─────────────────────────────────────────────────────────────────────────────
// Personalization / Human Vibes
// ─────────────────────────────────────────────────────────────────────────────

function getWardenVibe(name: string, module: string, venue: string) {
    const isSpecial = module.toUpperCase() === 'LUNCH' || module.toUpperCase() === 'BREAK'
    
    if (isSpecial) {
        const vibes = [
            { title: `✨ Time to refuel, ${name}`, body: `${module} starts in 10 mins. Enjoy the downtime.` },
            { title: `☕ Quick break?`, body: `${module} is about to start. Go stretch those legs.` },
            { title: `🔋 Reset Mode`, body: `${module} starts in 10. You've earned this.` }
        ]
        return vibes[Math.floor(Math.random() * vibes.length)]
    }

    const vibes = [
        { title: `🎒 Time to move, ${name}!`, body: `${module} starts in 10 mins @ ${venue || 'LT'}. Let's go.` },
        { title: `⚡ Heads up, ${name}`, body: `${module} is about to begin. See you in ${venue || 'the hall'}?` },
        { title: `🎯 Focus mode: ON`, body: `10 mins until ${module}. Everything packed?` },
        { title: `🚶‍♂️ Almost time, ${name}`, body: `${module} starts soon. Don't be the one walking in late!` }
    ]
    return vibes[Math.floor(Math.random() * vibes.length)]
}

function getAssignmentVibe(name: string, title: string, windowLabel: string, cohortPct: number) {
    const vibes: Record<string, any[]> = {
        '7d': [
            { title: `📅 On your radar, ${name}`, body: `"${title}" is due in a week. Just a soft nudge.` },
            { title: `👋 Future ${name} here`, body: `Just reminding you about "${title}" (7 days left).` }
        ],
        '24h': [
            { title: `🔴 Tomorrow, ${name}`, body: `"${title}" is due. This is the moment to lock in.` },
            { title: `⚡ Final stretch!`, body: `"${title}" deadline is in 24h. You've got this.` }
        ]
    }
    
    const defaults = vibes[windowLabel] || [{ title: `⏳ Nudge for ${name}`, body: `"${title}" is coming up soon.` }]
    return defaults[Math.floor(Math.random() * defaults.length)]
}

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
                    const vibe = getWardenVibe(firstName, lecture.module_name, lecture.venue || 'the hall')
                    const payload = JSON.stringify({
                        title: vibe.title,
                        body: vibe.body,
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

        const { data: assignments, error: assErr } = await supabase
            .from('assignments')
            .select('id, title, resource_url, task_type, program_id, due_date')
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
                    const subOrigin = row.device_type?.split('browser:')[1]
                    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'notify.logichq.tech'
                    
                    const subProgramId = row.users?.program_id
                    if (!subProgramId) {
                        const noProgLog = `[cron] User ${row.id} has no program_id, skipping`
                        console.log(noProgLog)
                        log.push(noProgLog)
                        return
                    }

                    if (siteUrl && subOrigin) {
                        const isLegacyOrigin = subOrigin.includes('vercel.app')
                        const isMainOrigin = subOrigin.includes('logichq.tech')
                        
                        if (!isLegacyOrigin && !isMainOrigin && !subOrigin.includes(siteUrl)) {
                            const originLog = `[cron] Filtering out unknown origin: ${subOrigin}`
                            console.log(originLog)
                            log.push(originLog)
                            return 
                        }
                    }

                    const sentMsg = `[cron] Sending to ${row.users?.full_name || row.id} (${row.device_type})`
                    console.log(sentMsg)
                    log.push(sentMsg)

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
                        await webpush.sendNotification(row.subscription, payload)
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
