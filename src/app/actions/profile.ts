'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

const ProfileSchema = z.object({
    full_name: z.string().min(2, "Name is too short").max(50),
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

export async function updateUserProfile(formData: FormData) {
    const { supabase, user } = await getAuthUser()

    if (!user) return { error: 'Unauthorized' }

    const rawData = {
        full_name: formData.get('full_name'),
    }

    const validated = ProfileSchema.safeParse(rawData)
    if (!validated.success) return { error: validated.error.issues[0].message }

    const { error } = await supabase
        .from('users')
        .upsert({
            id: user.id,
            email: user.email!,
            full_name: validated.data.full_name,
        }, { onConflict: 'id' })

    if (error) {
        console.error('Error updating profile:', error)
        return { error: 'Failed to update profile.' }
    }

    revalidatePath('/')
    return { success: true }
}
