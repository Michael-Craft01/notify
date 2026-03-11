'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'

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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Unauthorized: You must be logged in to log assignments.' }
    }

    // 2. Validate Data
    const rawData = {
        course_code: formData.get('course_code'),
        title: formData.get('title'),
        description: formData.get('description'),
        due_date: new Date(formData.get('due_date') as string).toISOString(),
    }

    const validatedFields = CreateAssignmentSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return { error: 'Invalid fields. Please check your submission.' }
    }

    // 3. Insert into Supabase (Default difficulty to 5 until AI phase)
    const { error: insertError } = await supabase
        .from('assignments')
        .insert({
            course_code: validatedFields.data.course_code.toUpperCase(),
            title: validatedFields.data.title,
            description: validatedFields.data.description,
            due_date: validatedFields.data.due_date,
            created_by: user.id,
            difficulty_score: 5,
        })

    if (insertError) {
        console.error(insertError)
        return { error: 'Failed to create assignment in the database.' }
    }

    revalidatePath('/')
    return { success: true }
}

export async function verifyAssignment(assignmentId: string) {
    const supabase = await createClient()

    // 1. Verify User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // 2. Insert Verification (PostgreSQL Trigger handles the 'verified' status upgrade)
    const { error } = await supabase
        .from('verifications')
        .insert({
            assignment_id: assignmentId,
            user_id: user.id,
        })

    if (error) {
        // Check for unique constraint violation (User already verified)
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // 2. Upsert Progress (using unique constraint on user_id + assignment_id)
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
