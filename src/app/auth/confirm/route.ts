import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const code = searchParams.get('code')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/'

    console.log('Auth Callback Debug:', {
        hasCode: !!code,
        type,
        next,
        cookies: request.cookies.getAll().map(c => c.name)
    })

    const error_description = searchParams.get('error_description')
    const error_name = searchParams.get('error')

    if (error_name) {
        const errorUrl = request.nextUrl.clone()
        errorUrl.pathname = '/login'
        errorUrl.searchParams.set('error', error_name)
        if (error_description) {
            errorUrl.searchParams.set('message', error_description)
        }
        return NextResponse.redirect(errorUrl)
    }

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = next
            redirectUrl.searchParams.delete('token_hash')
            redirectUrl.searchParams.delete('type')
            return NextResponse.redirect(redirectUrl)
        }
    } else if (code) {
        try {
            const supabase = await createClient()
            console.log('Auth: Exchanging code for session...')
            const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
            
            if (exchangeError) {
                console.error('Exchange Error:', exchangeError)
                return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent(exchangeError.message)}`, request.url))
            }

            if (data.user) {
                console.log('Auth: Session established, upserting user profile...')
                
                // Use service role to bypass RLS and guarantee the user record is created
                // if the Supabase trigger fails.
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

                if (!supabaseUrl || !serviceRoleKey) {
                    console.error('Critical Error: Missing Supabase environment variables in auth callback.')
                    return NextResponse.redirect(new URL('/login?message=Configuration+Error:+Service+Role+Key+missing', request.url))
                }

                const { createClient: createServiceClient } = await import('@supabase/supabase-js')
                const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey)

                const { error: upsertError } = await serviceClient
                    .from('users')
                    .upsert({
                        id: data.user.id,
                        email: data.user.email!,
                        full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
                    }, { onConflict: 'id' })

                if (upsertError) {
                    console.error('Upsert Error (Service Role):', upsertError)
                    // If the user record is missing, everything else fails. 
                    // Let's redirect back with a helpful message instead of proceeding to the dashboard.
                    const errorMessage = `Database Error: Failed to create user profile. ${upsertError.message}`
                    return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent(errorMessage)}`, request.url))
                }

                console.log('Auth: Profile verified, session active.')

                console.log('Auth: Redirecting to:', next)
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = next
                redirectUrl.searchParams.delete('code')
                return NextResponse.redirect(redirectUrl)
            }
        } catch (err: any) {
            console.error('Critical Auth Flow Error:', err)
            return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent(err.message || 'Critical auth error')}`, request.url))
        }
    }

    // return the user to an error page with some instructions
    const errorUrl = request.nextUrl.clone()
    errorUrl.pathname = '/login'
    errorUrl.searchParams.set('message', 'Authentication attempt failed. Please try again.')
    return NextResponse.redirect(errorUrl)
}
