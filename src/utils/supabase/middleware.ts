import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // --- Developer Bypass (Phase 4.5 Hotfix: DISABLED) ---
    /*
    const mockUserEmail = request.cookies.get('notify-mock-user')?.value
    const isLocal = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1'
    const mockUser = (mockUserEmail && isLocal) ? { id: '00000000-0000-0000-0000-000000000000', email: mockUserEmail } : null
    */
    const authenticated = user // Prioritize real session

    const isPublicAsset = 
        request.nextUrl.pathname === '/sw.js' ||
        request.nextUrl.pathname === '/manifest.json' ||
        request.nextUrl.pathname === '/robots.txt' ||
        request.nextUrl.pathname === '/sitemap.xml' ||
        request.nextUrl.pathname.startsWith('/favicon') ||
        request.nextUrl.pathname.startsWith('/icon-') ||
        request.nextUrl.pathname.startsWith('/og-image')

    if (
        !authenticated &&
        !isPublicAsset &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/api/test-notification') &&
        !request.nextUrl.pathname.startsWith('/api/send-deadline-alerts') &&
        !request.nextUrl.pathname.startsWith('/api/send-welcome')
    ) {
        // no user, potentially respond by redirecting the user to the login page
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user is logged in and tries to access login page, redirect to home
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
