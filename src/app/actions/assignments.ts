'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { scheduleDeadlineAlerts } from '@/trigger/deadline-alerts'

// Validation Schema
const CreateAssignmentSchema = z.object({
    course_code: z.string().min(2, "Course code is too short").max(20),
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z.string().max(500).optional(),
    due_date: z.string().datetime(),
})

export async function createAssignment(formData: FormData) {
    const supabase = await createClient()

    // 1. Verify User
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // --- Developer Bypass (Phase 4.5 Hotfix) ---
    if (!user) {
        const cookieStore = await cookies();
        const mockUserEmail = (await cookieStore).get('warden-mock-user')?.value;
        if (mockUserEmail) {
            user = { id: '00000000-0000-0000-0000-000000000000', email: mockUserEmail } as any;
        }
    }

    if (!user) {
        return { error: 'Unauthorized: You must be logged in to log assignments.' }
    }

    // 2. Validate Data
    const dueDateRaw = formData.get('due_date') as string
    const rawData = {
        course_code: formData.get('course_code'),
        title: formData.get('title'),
        description: formData.get('description'),
        due_date: new Date(dueDateRaw).toISOString(), // Captures date + time exactly
    }

    const validatedFields = CreateAssignmentSchema.safeParse(rawData)

    if (!validatedFields.success) {
        console.error("Zod Validation Error:", JSON.stringify(validatedFields.error.format(), null, 2))
        return { error: `Validation Failed: ${validatedFields.error.issues[0].message}` }
    }

    // 3. Insert into Supabase
    const { data: assignments, error: insertError } = await supabase
        .from('assignments')
        .insert({
            course_code: validatedFields.data.course_code.toUpperCase(),
            title: validatedFields.data.title,
            description: validatedFields.data.description,
            due_date: validatedFields.data.due_date,
            created_by: user.id,
            difficulty_score: 5,
        })
        .select()

    if (insertError || !assignments || assignments.length === 0) {
        console.error("Insert Error:", insertError)
        return { error: 'Failed to create assignment in the database.' }
    }

    const newAssignment = assignments[0]

    // 4. Auto-Verify for Creator (Phase 8)
    // This triggers the DB function and sets status to 'verified' since threshold is now 1
    const { error: verifyError } = await supabase
        .from('verifications')
        .insert({
            assignment_id: newAssignment.id,
            user_id: user.id
        })

    if (verifyError) {
        console.error('Auto-verification failed:', verifyError)
        // We don't return error here because the assignment was still created
    }

    // 5. Trigger Background Notification Matrix (Phase 4)
    try {
        await scheduleDeadlineAlerts.trigger({
            assignmentId: newAssignment.id,
            dueDate: validatedFields.data.due_date,
            title: validatedFields.data.title
        })
    } catch (triggerError) {
        console.error('Trigger.dev failed to schedule:', triggerError)
    }

    revalidatePath('/')
    return { success: true }
}

export async function verifyAssignment(assignmentId: string) {
    const supabase = await createClient()

    // 1. Verify User
    let { data: { user } } = await supabase.auth.getUser()

    // --- Developer Bypass (Phase 4.5 Hotfix) ---
    if (!user) {
        const cookieStore = await cookies();
        const mockUserEmail = (await cookieStore).get('warden-mock-user')?.value;
        if (mockUserEmail) {
            user = { id: '00000000-0000-0000-0000-000000000000', email: mockUserEmail } as any;
        }
    }

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // 2. Insert Verification
    const { error } = await supabase
        .from('verifications')
        .insert({
            assignment_id: assignmentId,
            user_id: user.id,
        })

    if (error) {
        if (error.code === '23505') {
            return { error: 'You have already verified this assignment.' }
        }
        return { error: 'Failed to record verification.' }
    }

    revalidatePath('/')
    return { success: true }
}

export async function updateProgress(assignmentId: string, status: 'not_started' | 'in_progress' | 'finished') {
    const supabase = await createClient()

    // 1. Verify User
    let { data: { user } } = await supabase.auth.getUser()

    // --- Developer Bypass (Phase 4.5 Hotfix) ---
    if (!user) {
        const cookieStore = await cookies();
        const mockUserEmail = (await cookieStore).get('warden-mock-user')?.value;
        if (mockUserEmail) {
            user = { id: '00000000-0000-0000-0000-000000000000', email: mockUserEmail } as any;
        }
    }

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // 2. Upsert Progress
    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            assignment_id: assignmentId,
            status: status,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, assignment_id'
        })

    if (error) {
        console.error('Error updating progress:', error)
        return { error: 'Failed to update progress.' }
    }

    revalidatePath('/')
    return { success: true }
}
