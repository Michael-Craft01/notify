'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { WelcomeNudgeEmail } from '@/emails/WelcomeNudge'

const resend = new Resend(process.env.RESEND_API_Key)

async function sendWelcomeEmail(email: string, firstName: string) {
    try {
        await resend.emails.send({
            from: 'onboarding@notify.logichq.tech',
            to: [email],
            subject: `Welcome to Notify, ${firstName}! 🧡`,
            react: WelcomeNudgeEmail({ firstName }),
        })
    } catch (err) {
        console.error('Failed to send welcome email:', err)
    }
}

export async function createProgram(inviteCode: string, programName?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
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

        const { error: uError } = await supabase
            .from('users')
            .update({
                program_id: program.id,
                role: 'rep'
            })
            .eq('id', authUser.id)

        if (uError) throw uError

        // Trigger Welcome Email
        const firstName = (authUser.email?.split('@')[0] || 'there').split(' ')[0]
        if (authUser.email) {
            await sendWelcomeEmail(authUser.email, firstName)
        }

        revalidatePath('/')
        return { success: true, programId: program.id }
    } catch (err: any) {
        console.error('Error creating program:', err)
        return { error: err.message || 'Failed to create program' }
    }
}

export async function joinProgram(programId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
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
        const { error: uError } = await supabase
            .from('users')
            .update({ program_id: programId })
            .eq('id', authUser.id)

        if (uError) throw uError

        // Trigger Welcome Email
        const firstName = (authUser.email?.split('@')[0] || 'there').split(' ')[0]
        if (authUser.email) {
            await sendWelcomeEmail(authUser.email, firstName)
        }

        revalidatePath('/')
        return { success: true }
    } catch (err: any) {
        console.error('Error joining program:', err)
        return { error: err.message || 'Failed to join program' }
    }
}
