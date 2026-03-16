'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveExtractedSchedule(lectures: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { data: userProfile } = await supabase
        .from("users")
        .select("program_id, role")
        .eq("id", user.id)
        .single()

    if (userProfile?.role !== 'rep' && userProfile?.role !== 'admin') {
        return { error: "Only class reps can set the schedule." }
    }

    const programId = userProfile.program_id
    if (!programId) return { error: "You must be in a class to set a schedule." }

    // Transform lectures for insertion
    const toInsert = lectures.map(l => ({
        program_id: programId,
        day_of_week: l.day_of_week,
        start_time: l.start_time,
        end_time: l.end_time,
        module_name: l.module_name,
        course_code: l.course_code?.toUpperCase(),
        venue: l.venue,
        created_by: user.id
    }))

    const { error } = await supabase
        .from("schedules")
        .insert(toInsert)

    if (error) {
        console.error("Schedule Insert Error:", error)
        return { error: error.message }
    }

    revalidatePath("/")
    return { success: true }
}

export async function toggleScheduleOverride(scheduleId: string, date: string, isCancelled: boolean, reason?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { data: userProfile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

    if (userProfile?.role !== 'rep' && userProfile?.role !== 'admin') {
        return { error: "Only class reps can cancel classes." }
    }

    const { error } = await supabase
        .from("schedule_overrides")
        .upsert({
            schedule_id: scheduleId,
            override_date: date,
            is_cancelled: isCancelled,
            reason: reason
        }, { onConflict: 'schedule_id, override_date' })

    if (error) {
        console.error("Override Error:", error)
        return { error: error.message }
    }

    revalidatePath("/")
    return { success: true }
}
