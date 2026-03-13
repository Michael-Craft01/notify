'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

// Validation Schema — includes new task_type, resource_url, location
const CreateAssignmentSchema = z.object({
    course_code: z.string().min(2, "Course code is too short").max(20),
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z.string().max(500).optional(),
    due_date: z.string().datetime(),
    task_type: z.enum(['assignment', 'quiz', 'online_test', 'physical_test']).default('assignment'),
    resource_url: z.string().url().optional().or(z.literal('')),
    location: z.string().max(200).optional(),
})

async function getAuthUser() {
    const supabase = await createClient()
    let { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        const cookieStore = await cookies()
        const mockUserEmail = cookieStore.get('notify-mock-user')?.value
        if (mockUserEmail) {
            user = { id: '00000000-0000-0000-0000-000000000000', email: mockUserEmail } as any
        }
    }

    return { supabase, user }
}

export async function createAssignment(formData: FormData) {
    const { supabase, user } = await getAuthUser()

    if (!user) {
        return { error: 'Unauthorized: You must be logged in.' }
    }

    const dueDateRaw = formData.get('due_date') as string
    let isoDate: string
    try {
        const d = new Date(dueDateRaw)
        if (isNaN(d.getTime())) throw new Error("Invalid date")
        isoDate = d.toISOString()
    } catch (e) {
        console.error("Date parsing error:", dueDateRaw)
        return { error: 'Invalid date format provided. Please use a standard date/time.' }
    }

    const rawData = {
        course_code: formData.get('course_code'),
        title: formData.get('title'),
        description: formData.get('description') || undefined,
        due_date: isoDate,
        task_type: formData.get('task_type') || 'assignment',
        resource_url: formData.get('resource_url') || undefined,
        location: formData.get('location') || undefined,
    }

    const validated = CreateAssignmentSchema.safeParse(rawData)

    if (!validated.success) {
        console.error("Validation error:", validated.error.issues)
        return { error: `Validation Failed: ${validated.error.issues[0].message}` }
    }

    const insertData: Record<string, any> = {
        course_code: validated.data.course_code.toUpperCase(),
        title: validated.data.title,
        description: validated.data.description,
        due_date: validated.data.due_date,
        created_by: user.id,
        difficulty_score: 5,
        task_type: validated.data.task_type,
    }

    // Only include fields if they exist in DB — graceful fallback
    if (validated.data.resource_url) insertData.resource_url = validated.data.resource_url
    if (validated.data.location) insertData.location = validated.data.location

    const { data: assignments, error: insertError } = await supabase
        .from('assignments')
        .insert(insertData)
        .select()

    if (insertError || !assignments || assignments.length === 0) {
        console.error("Insert Error:", insertError)
        // If the columns don't exist yet, retry without them
        if (insertError?.code === '42703') {
            const { data: fallback, error: fallbackError } = await supabase
                .from('assignments')
                .insert({
                    course_code: insertData.course_code,
                    title: insertData.title,
                    description: insertData.description,
                    due_date: insertData.due_date,
                    created_by: user.id,
                    difficulty_score: 5,
                })
                .select()

            if (fallbackError || !fallback?.length) {
                return { error: 'Failed to create task.' }
            }

            // Skip trigger on fallback path
            revalidatePath('/')
            return { success: true }
        }
        return { error: 'Failed to create task in the database.' }
    }

    const newAssignment = assignments[0]

    // Auto-verify creator
    await supabase.from('verifications').insert({
        assignment_id: newAssignment.id,
        user_id: user.id
    })

    // Schedule future notifications via Vercel Cron (runs every hour automatically)
    // No per-assignment scheduling needed

    revalidatePath('/')
    return { success: true }
}

export async function updateAssignment(assignmentId: string, formData: FormData) {
    const { supabase, user } = await getAuthUser()

    if (!user) return { error: 'Unauthorized' }

    const rawData = {
        course_code: formData.get('course_code'),
        title: formData.get('title'),
        description: formData.get('description') || undefined,
        due_date: new Date(formData.get('due_date') as string).toISOString(),
        task_type: formData.get('task_type') || 'assignment',
        resource_url: formData.get('resource_url') || undefined,
        location: formData.get('location') || undefined,
    }

    const validated = CreateAssignmentSchema.safeParse(rawData)
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase
        .from('assignments')
        .update({
            course_code: validated.data.course_code.toUpperCase(),
            title: validated.data.title,
            description: validated.data.description,
            due_date: validated.data.due_date,
            task_type: validated.data.task_type,
            resource_url: validated.data.resource_url,
            location: validated.data.location,
        })
        .eq('id', assignmentId)
        .eq('created_by', user.id)

    if (error) return { error: 'Failed to update task.' }

    revalidatePath('/')
    return { success: true }
}

export async function deleteAssignment(assignmentId: string) {
    const { supabase, user } = await getAuthUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)
        .eq('created_by', user.id)

    if (error) return { error: 'Failed to delete task.' }

    revalidatePath('/')
    return { success: true }
}

export async function verifyAssignment(assignmentId: string) {
    const { supabase, user } = await getAuthUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('verifications')
        .insert({ assignment_id: assignmentId, user_id: user.id })

    if (error) {
        if (error.code === '23505') return { error: 'Already verified.' }
        return { error: 'Failed to record verification.' }
    }

    revalidatePath('/')
    return { success: true }
}

export async function updateProgress(assignmentId: string, status: 'not_started' | 'in_progress' | 'finished') {
    const { supabase, user } = await getAuthUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            assignment_id: assignmentId,
            status,
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
