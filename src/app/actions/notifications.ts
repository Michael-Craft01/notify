'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import webpush from '@/utils/webpush'

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Returns both the user and the correct Supabase client to use.
 * For dev bypass users, returns a service-role client so RLS doesn't block writes.
 */
async function getAuthContext() {
    const supabase = await createClient()
    let { data: { user } } = await supabase.auth.getUser()
    let isDevUser = false

    if (!user) {
        const cookieStore = await cookies()
        const mockUserEmail = cookieStore.get('notify-mock-user')?.value
        if (mockUserEmail) {
            user = { id: MOCK_USER_ID, email: mockUserEmail } as any
            isDevUser = true
        }
    }

    // Dev bypass users have no real session → auth.uid() is null → RLS blocks writes.
    // Use service role client to bypass RLS for dev users only.
    const writeClient = isDevUser
        ? createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        : supabase

    return { supabase, writeClient, user, isDevUser }
}

export async function saveSubscription(subscription: any) {
    const { writeClient, user } = await getAuthContext()
    if (!user) return { error: 'Unauthorized' }

    // Validate the subscription shape before saving
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return { error: 'Invalid subscription object. Please try enabling alerts again.' }
    }

    const { data: existing } = await writeClient
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .contains('subscription', { endpoint: subscription.endpoint })
        .single()

    const { error } = await writeClient
        .from('user_subscriptions')
        .upsert(
            { 
                user_id: user.id, 
                subscription, 
                device_type: subscription.origin ? `browser:${subscription.origin}` : 'browser' 
            },
            { onConflict: 'user_id, subscription' }
        )

    if (error) {
        console.error('[notifications] saveSubscription error:', error)
        return { error: `Failed to save subscription: ${error.message}` }
    }

    // Send Welcome Notification if this is the first time
    if (!existing) {
        try {
            const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
            const firstName = fullName.split(' ')[0]

            await webpush.sendNotification(
                subscription,
                JSON.stringify({
                    title: `🚀 Welcome, ${firstName}!`,
                    body: "Alerts are active. Tip: Install the app for the full experience. 💡",
                    url: '/',
                    urgency: 'high',
                })
            )
        } catch (pushErr) {
            console.warn('[notifications] Welcome push failed:', pushErr)
        }
    }

    revalidatePath('/')
    return { success: true }
}

export async function removeSubscription(endpoint: string) {
    const { writeClient, user } = await getAuthContext()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await writeClient
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .contains('subscription', { endpoint })

    if (error) {
        console.error('[notifications] removeSubscription error:', error)
        return { error: 'Failed to remove notification subscription.' }
    }

    return { success: true }
}

export async function sendTestNotification() {
    const { writeClient, user } = await getAuthContext()
    if (!user) return { error: 'Unauthorized' }

    const { data: subs, error } = await writeClient
        .from('user_subscriptions')
        .select('id, subscription')
        .eq('user_id', user.id)
        .limit(5)

    if (error || !subs?.length) {
        return { error: 'No active subscriptions found. Enable alerts first.' }
    }

    let sent = 0
    const toDelete: string[] = []

    for (const row of subs) {
        try {
            await webpush.sendNotification(
                row.subscription,
                JSON.stringify({
                    title: '🔔 Notify Alerts Active',
                    body: 'You will receive deadline reminders 48h, 24h, and 6h before tasks are due.',
                    url: '/',
                    urgency: 'normal',
                })
            )
            sent++
        } catch (err: any) {
            console.error('[notifications] sendTest failed:', err?.statusCode)
            if (err?.statusCode === 410 || err?.statusCode === 404) {
                toDelete.push(row.id)
            }
        }
    }

    if (toDelete.length) {
        await writeClient.from('user_subscriptions').delete().in('id', toDelete)
    }

    if (sent === 0) {
        return { error: 'Push delivery failed. Check VAPID keys are correct.' }
    }

    return { success: true, sent }
}
export async function broadcastToEveryone(title: string, body: string, url: string = '/') {
    const { writeClient, user } = await getAuthContext()
    if (!user) return { error: 'Unauthorized' }

    // Check if user is a rep or admin
    const { data: profile } = await writeClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'rep' && profile?.role !== 'admin') {
        return { error: 'Only reps can broadcast to everyone.' }
    }

    const { data: subs, error } = await writeClient
        .from('user_subscriptions')
        .select('id, subscription')

    if (error || !subs?.length) {
        return { error: 'No active subscriptions found.' }
    }

    let sent = 0
    const toDelete: string[] = []

    for (const row of subs) {
        try {
            await webpush.sendNotification(
                row.subscription,
                JSON.stringify({
                    title,
                    body,
                    url,
                    urgency: 'high',
                })
            )
            sent++
        } catch (err: any) {
            console.error('[notifications] broadcast failed:', err?.statusCode)
            if (err?.statusCode === 410 || err?.statusCode === 404) {
                toDelete.push(row.id)
            }
        }
    }

    if (toDelete.length) {
        await writeClient.from('user_subscriptions').delete().in('id', toDelete)
    }

    return { success: true, sent }
}
