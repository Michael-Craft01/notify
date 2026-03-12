'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function sendOTP(email: string) {
    const supabase = await createClient()

    // Security Note: In a production app, validate the domain here
    // e.g., if (!email.endsWith('@university.edu.zw')) return { error: 'Invalid domain' }

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
        },
    })

    if (error) {
        console.error('OTP Send Error:', error)
        return { error: error.message }
    }

    return { success: true }
}

export async function verifyOTP(email: string, token: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
    })

    if (error) {
        console.error('OTP Verify Error:', error)
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
