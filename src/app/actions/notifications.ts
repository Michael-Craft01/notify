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

    // Self-healing: Ensure mock user exists in public.users to avoid FK errors
    if (isDevUser && user) {
        await writeClient.from('users').upsert({
            id: MOCK_USER_ID,
            email: user.email!,
            full_name: 'Notify Developer',
            program_id: 'a673dab5-294b-42bd-b07c-b468cffa8563' // CS 2.1 Program ID
        }, { onConflict: 'id' })
    }

    return { supabase, writeClient, user, isDevUser }
}

export async function saveSubscription(subscription: any, silent = false) {
    const { writeClient, user } = await getAuthContext()
    if (!user) {
        console.error('[notifications] saveSubscription: No authenticated user found.')
        return { error: 'Unauthorized' }
    }

    // Validate the subscription shape before saving
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        console.error('[notifications] saveSubscription: Invalid subscription shape:', subscription)
        return { error: 'Invalid subscription object. Please try enabling alerts again.' }
    }

    console.log(`[notifications] Saving sub for user ${user.id} (${subscription.origin || 'unknown origin'})`)

    const { data: existing, error: existErr } = await writeClient
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .contains('subscription', { endpoint: subscription.endpoint })
        .single()

    if (existErr && existErr.code !== 'PGRST116') {
        console.warn('[notifications] Check existing error:', existErr.message)
    }

    const { data: savedData, error } = await writeClient
        .from('user_subscriptions')
        .upsert(
            { 
                id: existing?.id, // If it doesn't exist, this is undefined → Insert. If it does → Update.
                user_id: user.id, 
                subscription, 
                device_type: subscription.origin ? `browser:${subscription.origin}` : 'browser' 
            }
        )
        .select()
        .single()

    if (error) {
        console.error('[notifications] saveSubscription DB error:', error.message)
        return { error: `Failed to save subscription: ${error.message}` }
    }

    console.log(`[notifications] Sub saved successfully for ${user.id}`)

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

    if (!silent) revalidatePath('/')
    return { success: true, saved: savedData }
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
