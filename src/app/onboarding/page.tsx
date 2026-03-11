import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function OnboardingPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if they already have a full name set
    const { data: profile } = await supabase
        .from('users')
        .select('full_name, cohort_year')
        .eq('id', user.id)
        .single()

    if (profile?.full_name && profile?.cohort_year) {
        redirect('/') // Already onboarded
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--color-background)]">
            <div className="w-full max-w-sm flex flex-col items-center gap-6 rounded-2xl bg-[var(--color-surface)] p-8 shadow-xl border border-[var(--color-surface-hover)]">

                <div className="flex flex-col items-center text-center gap-2">
                    <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Welcome to Notify</h1>
                    <p className="text-sm text-[var(--color-text-muted)]">Complete your profile to enter the Warden network.</p>
                </div>

                <form action="/auth/complete-profile" method="POST" className="w-full flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="full_name" className="text-sm font-medium text-[var(--color-text-main)]">
                            Full Name
                        </label>
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            placeholder="e.g. John Doe"
                            required
                            className="rounded-lg border border-[var(--color-surface-hover)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="cohort_year" className="text-sm font-medium text-[var(--color-text-main)]">
                            Graduation / Cohort Year
                        </label>
                        <input
                            id="cohort_year"
                            name="cohort_year"
                            type="number"
                            placeholder="e.g. 2026"
                            min="2024"
                            max="2035"
                            required
                            className="rounded-lg border border-[var(--color-surface-hover)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-4 w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)]"
                    >
                        Join Network
                    </button>
                </form>
            </div>
        </div>
    )
}
