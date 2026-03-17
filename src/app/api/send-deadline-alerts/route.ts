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
    },
    {
        label: '3d',
        ms: 3 * 24 * 60 * 60 * 1000,
        urgency: 'normal' as const,
    },
    {
        label: '48h',
        ms: 48 * 60 * 60 * 1000,
        urgency: 'high' as const,
    },
    {
        label: '24h',
        ms: 24 * 60 * 60 * 1000,
        urgency: 'high' as const,
    },
    {
        label: '12h',
        ms: 12 * 60 * 60 * 1000,
        urgency: 'high' as const,
    },
    {
        label: '2h',
        ms: 2 * 60 * 60 * 1000,
        urgency: 'critical' as const,
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
            { title: `✨ Break Time, ${name}`, body: `${module} starts in 10 mins. Reset mode: ON.` },
            { title: `☕ Time to refuel?`, body: `${module} is starting. Go grab a coffee.` },
            { title: `🔋 Recharge, ${name}`, body: `10 mins until ${module}. You've earned this.` }
        ]
        return vibes[Math.floor(Math.random() * vibes.length)]
    }

    const vibes = [
        { title: `🎒 Class in 10, ${name}!`, body: `${module} @ ${venue || 'LT'}. Let's move.` },
        { title: `⚡ Heads up: ${module}`, body: `Starts in 10 mins. See you in ${venue || 'the hall'}?` },
        { title: `🎯 Focus: ${module}`, body: `10 mins to go. Everything in your bag?` },
        { title: `🚶‍♂️ Almost time, ${name}`, body: `${module} starts soon. Don't be late!` }
    ]
    return vibes[Math.floor(Math.random() * vibes.length)]
}

function getAssignmentVibe(name: string, title: string, windowLabel: string, cohortPct: number) {
    const vibes: Record<string, any[]> = {
        '7d': [
            { title: `📅 7 Days: ${title}`, body: `Due in a week, ${name}. ${cohortPct > 0 ? `${cohortPct}% are already done.` : "Just a soft nudge."}` },
            { title: `👋 Radar Check: ${name}`, body: `"${title}" is due in 7 days. No rush, just keeping you posted.` }
        ],
        '3d': [
            { title: `⏳ 3 Days: ${title}`, body: `Due soon, ${name}. Open it for 5 mins today?` },
            { title: `🗓️ 3-Day Countdown`, body: `Hey ${name}, "${title}" is due in 3 days. Got a plan?` }
        ],
        '48h': [
            { title: `🕒 48h Left: ${title}`, body: `2 days to go, ${name}. Time for the final push!` },
            { title: `🚀 T-Minus 2 Days`, body: `Final 48h for "${title}". You've got this.` }
        ],
        '24h': [
            { title: `🔴 TOMORROW: ${title}`, body: `24 hours left, ${name}. Let's lock in.` },
            { title: `⚡ Final 24h!`, body: `"${title}" is due tomorrow. Finish line is close.` }
        ],
        '12h': [
            { title: `⚠️ 12h Left: ${title}`, body: `Wrap it up, ${name}. 12 hours until it's due.` },
            { title: `🕛 The 12h Mark`, body: `Almost there! 12 hours left for "${title}".` }
        ],
        '2h': [
            { title: `🔥 2h LEFT: ${title}`, body: `Due in 2 hours, ${name}. Focus Mode: ON.` },
            { title: `🚨 CRITICAL: 2 Hours`, body: `"${title}" is due NOW. Drop everything else!` }
        ]
    }
    
    const defaults = vibes[windowLabel] || [{ title: `⏳ Nudge: ${name}`, body: `"${title}" is coming up.` }]
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
    const fifteenMinsFromNow = new Date(now + 15 * 60 * 1000)
    const tenMinsAgo = new Date(now - 10 * 60 * 1000)
    
    const nowTimeStr = nowTime.toTimeString().slice(0, 5)
    const fifteenMinsTimeStr = fifteenMinsFromNow.toTimeString().slice(0, 5)
    const tenMinsAgoStr = tenMinsAgo.toTimeString().slice(0, 5)
    
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

    const isBroadcast = req.nextUrl.searchParams.get('broadcast') === 'true'
    if (isBroadcast) {
        return NextResponse.json({ error: 'Global broadcast is disabled for privacy. Notifications are now program-specific.' }, { status: 403 })
    }

    // ── 1. WARDEN SCHEDULE ALERTS (Just started or upcoming) ────────
    const { data: lectures } = await supabase
        .from('schedules')
        .select('*')
        .eq('day_of_week', currentDay)
        .gte('start_time', tenMinsAgoStr + ':00')
        .lte('start_time', fifteenMinsTimeStr + ':59')

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
                        await webpush.sendNotification(row.subscription, payload, {
                            headers: {
                                'Urgency': 'high',
                                'TTL': 60 * 60 // 1 hour
                            }
                        })
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

                    const vibe = getAssignmentVibe(firstName, assignment.title, window.label, cohortPct)

                    const payload = JSON.stringify({
                        title: vibe.title,
                        body: vibe.body,
                        url: assignment.resource_url || '/',
                        urgency: window.urgency,
                    })

                    try {
                        await webpush.sendNotification(row.subscription, payload, {
                            headers: {
                                'Urgency': (window.urgency === 'high' || (window as any).urgency === 'critical') ? 'high' : 'normal',
                                'TTL': 60 * 60 // 1 hour
                            }
                        })
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

            log.push(`[${window.label}] "${assignment.title}" → ${scopedSubs.length - toDelete.length} scoped subs`)
        }
    }

    console.log(`[cron/adhd] sent=${totalSent} pruned=${totalPruned}`, log)
    return NextResponse.json({ ok: true, sent: totalSent, pruned: totalPruned, log })
}
