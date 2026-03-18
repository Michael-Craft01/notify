import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/utils/emails'

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

        const { data, error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error && data?.user) {
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
                console.log('Auth: Session established, checking for pending invites...')
                
                const pendingInviteCode = request.cookies.get('pending_invite_code')?.value
                let programId = null

                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

                if (!supabaseUrl || !serviceRoleKey) {
                    console.error('Critical Error: Missing Supabase environment variables in auth callback.')
                    return NextResponse.redirect(new URL('/login?message=Configuration+Error:+Service+Role+Key+missing', request.url))
                }

                const { createClient: createServiceClient } = await import('@supabase/supabase-js')
                const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey)

                // 1. Resolve Program ID if invite code exists
                if (pendingInviteCode) {
                    const { data: programData } = await serviceClient
                        .from('programs')
                        .select('id')
                        .eq('invite_code', pendingInviteCode.toUpperCase())
                        .single()
                    
                    if (programData) {
                        programId = programData.id
                        console.log(`[auth] Auto-assigning program ${programId} via code ${pendingInviteCode}`)
                    }
                }

                // 2. Upsert user with program_id
                const { error: upsertError } = await serviceClient
                    .from('users')
                    .upsert({
                        id: data.user.id,
                        email: data.user.email!,
                        full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
                        program_id: programId,
                    }, { onConflict: 'id' })

                if (upsertError) {
                    console.error('Upsert Error (Service Role):', upsertError)
                    const errorMessage = `Database Error: Failed to create user profile. ${upsertError.message}`
                    return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent(errorMessage)}`, request.url))
                }

                // 2.5 Send Welcome Email if not already sent
                const { data: existingUser } = await serviceClient
                    .from('users')
                    .select('welcome_sent, full_name')
                    .eq('id', data.user.id)
                    .single()
                
                if (!existingUser?.welcome_sent) {
                    const firstName = (existingUser?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'there').split(' ')[0]
                    const emailSent = await sendWelcomeEmail(data.user.email!, firstName)
                    if (emailSent.success) {
                        await serviceClient.from('users').update({ welcome_sent: true }).eq('id', data.user.id)
                    }
                }

                console.log('Auth: Profile verified, session active.')

                // 3. Prepare response and clear cookie
                const redirectUrl = new URL(next, request.url)
                const response = NextResponse.redirect(redirectUrl)
                
                if (pendingInviteCode) {
                    response.cookies.delete('pending_invite_code')
                }

                return response
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
