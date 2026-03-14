import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    const formData = await request.formData()
    const fullName = String(formData.get('full_name'))
    const cohortYear = parseInt(String(formData.get('cohort_year')), 10)
    const programId = String(formData.get('program_id'))

    // Basic validation
    if (!fullName || !cohortYear || isNaN(cohortYear) || !programId) {
        return NextResponse.redirect(new URL('/onboarding?error=Invalid_Input', request.url))
    }

    const supabase = await createClient()

    // Verify auth session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Upsert user profile in our public.users table (creates if doesn't exist)
    const { error: updateError } = await supabase
        .from('users')
        .upsert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            cohort_year: cohortYear,
            program_id: programId
        }, { onConflict: 'id' })

    if (updateError) {
        console.error('Error updating profile:', updateError)
        // In production, handle this gracefully
        return NextResponse.redirect(new URL('/onboarding?error=Update_Failed', request.url))
    }

    // Successfully onboarded, redirect to dashboard
    return NextResponse.redirect(new URL('/', request.url))
}
