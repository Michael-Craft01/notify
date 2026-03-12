'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSubscription(subscription: any) {
    const supabase = await createClient()

    // 1. Verify User
    const { data: { user } } = await supabase.auth.getUser()
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
