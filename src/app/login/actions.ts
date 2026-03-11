'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
    }

    // Security Note: In a production app, validate the domain here
    // e.g., if (!data.email.endsWith('@university.edu.zw')) throw Error...

    const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
            // set this to false if you do not want the user to be automatically signed up
            shouldCreateUser: true,
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`
        },
    })

    if (error) {
        redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Check your email for the magic link.')
}
