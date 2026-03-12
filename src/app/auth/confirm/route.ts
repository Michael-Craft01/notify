import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const code = searchParams.get('code')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/'

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
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = next
            redirectUrl.searchParams.delete('code')
            return NextResponse.redirect(redirectUrl)
        }
    }

    // return the user to an error page with some instructions
    const errorUrl = request.nextUrl.clone()
    errorUrl.pathname = '/login'
    errorUrl.searchParams.set('message', 'Invalid or expired magic link.')
    return NextResponse.redirect(errorUrl)
}
