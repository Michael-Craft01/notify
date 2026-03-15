import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params
    
    // 1. Create the response redirecting to /login
    const response = NextResponse.redirect(new URL('/login', request.url))
    
    // 2. Set the secure cookie with the invite code
    // We set it for 1 hour to allow plenty of time for OAuth/Email login
    response.cookies.set('pending_invite_code', code.toUpperCase(), {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
    })
    
    console.log(`[join] Stored invite code: ${code}`)
    
    return response
}
