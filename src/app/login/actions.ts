'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
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

export async function signInWithOAuth(provider: 'google') {
    const supabase = await createClient()
    
    // In production, we must use the absolute Vercel URL
    // We prioritize NEXT_PUBLIC_SITE_URL, then fall back to the Vercel System URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
        || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')
    
    const redirectUrl = `${siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl}/auth/confirm`

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: false // Ensure server-side redirect handled by Supabase
        },
    })

    if (error) {
        console.error(`${provider} Sign In Error:`, error)
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url) // Perform the server-side redirect
    }

    return { success: true }
}

export async function verifyOTP(email: string, token: string) {

    const supabase = await createClient()

    // --- Developer Bypass (Phase 4.5 Hotfix) ---
    const bypassCode = process.env.NOTIFY_DEV_BYPASS
    if (bypassCode && token === bypassCode) {
        console.warn('NOTIFY DEBUG: Auth bypass triggered for:', email)

        // We'll set a special "notify-mock-auth" cookie that the middleware will respect
        const cookieStore = await cookies()
        cookieStore.set('notify-mock-user', email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 // 24 hours
        })

        // Ensure mock user exists in public.users to avoid FK errors
        const mockId = '00000000-0000-0000-0000-000000000000'
        await supabase.from('users').upsert({
            id: mockId,
            email: email,
            full_name: 'Notify Developer'
        }, { onConflict: 'id' })

        revalidatePath('/', 'layout')
        return { success: true }
    }

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
