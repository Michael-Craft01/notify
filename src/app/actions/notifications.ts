'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSubscription(subscription: any) {
    const supabase = await createClient()

    // 1. Verify User
    let { data: { user } } = await supabase.auth.getUser()

    // --- Developer Bypass (Phase 4.5 Hotfix) ---
    if (!user) {
        const cookieStore = await cookies()
        const mockUserEmail = (await cookieStore).get('notify-mock-user')?.value
        if (mockUserEmail) {
            user = { id: '00000000-0000-0000-0000-000000000000', email: mockUserEmail } as any
        }
    }

    if (!user) return { error: 'Unauthorized' }

    // 2. Save Subscription to Database
    const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: user.id,
            subscription: subscription,
            device_type: 'browser'
        }, {
            onConflict: 'user_id, subscription'
        })

    if (error) {
        console.error('Error saving subscription:', error)
        return { error: 'Failed to record subscription.' }
    }

    revalidatePath('/')
    return { success: true }
}
