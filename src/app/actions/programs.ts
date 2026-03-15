'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function createProgram(inviteCode: string, programName?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Auth fallback for local dev if necessary
    let authUser = user
    if (!authUser) {
        const cookieStore = await cookies()
        const mockUserEmail = cookieStore.get('notify-mock-user')?.value
        if (mockUserEmail) {
            authUser = { id: '00000000-0000-0000-0000-000000000000', email: mockUserEmail } as any
        }
    }

    if (!authUser) return { error: 'Unauthorized' }

    try {
        // 1. Create the program
        const { data: program, error: pError } = await supabase
            .from('programs')
            .insert({
                name: programName || inviteCode.toUpperCase(),
                invite_code: inviteCode.toUpperCase(),
                created_by: authUser.id,
                is_public: true
            })
            .select()
            .single()

        if (pError) throw pError

        // 2. Update user as the 'rep' and part of this program
        const { error: uError } = await supabase
            .from('users')
            .update({
                program_id: program.id,
                role: 'rep'
            })
            .eq('id', authUser.id)

        if (uError) throw uError

        revalidatePath('/')
        return { success: true, programId: program.id }
    } catch (err: any) {
        console.error('Error creating program:', err)
        return { error: err.message || 'Failed to create program' }
    }
}
