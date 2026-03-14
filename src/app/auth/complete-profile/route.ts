import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    const formData = await request.formData()
    const fullName = String(formData.get('full_name'))
    const cohortYear = parseInt(String(formData.get('cohort_year')), 10)
    const isCreatingNew = String(formData.get('is_creating_new')) === 'true'
    let programId = String(formData.get('program_id'))

    // Basic validation
    if (!fullName || !cohortYear || isNaN(cohortYear)) {
        return NextResponse.redirect(new URL('/onboarding?error=Invalid_Input', request.url))
    }

    const supabase = await createClient()

    // Handle new program creation
    if (isCreatingNew) {
        const newProgramName = String(formData.get('new_program_name'))
        const newProgramId = String(formData.get('new_program_id')).toUpperCase()

        if (!newProgramName || !newProgramId) {
            return NextResponse.redirect(new URL('/onboarding?error=Missing_Program_Details', request.url))
        }

        const { error: progError } = await supabase
            .from('programs')
            .upsert({ id: newProgramId, name: newProgramName }, { onConflict: 'id' })

        if (progError) {
            console.error('Error creating program:', progError)
            return NextResponse.redirect(new URL('/onboarding?error=Program_Creation_Failed', request.url))
        }
        programId = newProgramId
    }

    if (!programId || programId === 'undefined') {
        return NextResponse.redirect(new URL('/onboarding?error=No_Program_Selected', request.url))
    }

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
