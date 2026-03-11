import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    const formData = await request.formData()
    const fullName = String(formData.get('full_name'))
    const cohortYear = parseInt(String(formData.get('cohort_year')), 10)

    // Basic validation
    if (!fullName || !cohortYear || isNaN(cohortYear)) {
        return NextResponse.redirect(new URL('/onboarding?error=Invalid_Input', request.url))
    }

    const supabase = await createClient()

    // Verify auth session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Update user profile in our public.users table
    const { error: updateError } = await supabase
        .from('users')
        .update({
            full_name: fullName,
            cohort_year: cohortYear
        })
        .eq('id', user.id)

    if (updateError) {
        console.error('Error updating profile:', updateError)
        // In production, handle this gracefully
        return NextResponse.redirect(new URL('/onboarding?error=Update_Failed', request.url))
    }

    // Successfully onboarded, redirect to dashboard
    return NextResponse.redirect(new URL('/', request.url))
}
