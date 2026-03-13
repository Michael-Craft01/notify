'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signOut() {
    const supabase = await createClient()
    
    // 1. Supabase Sign Out
    await supabase.auth.signOut()

    // 2. Clear Mock Cookie
    const cookieStore = await cookies()
    cookieStore.delete('notify-mock-user')

    // 3. Revalidate & Redirect
    revalidatePath('/', 'layout')
    redirect('/login')
}
