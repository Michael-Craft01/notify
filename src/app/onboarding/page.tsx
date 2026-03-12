import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Terminal } from 'lucide-react'
import OnboardingForm from '@/components/OnboardingForm'

export default async function OnboardingPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('users')
        .select('full_name, cohort_year')
        .eq('id', user.id)
        .single()

    if (profile?.full_name && profile?.cohort_year) {
        redirect('/') // Already onboarded
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0b0b0b] font-sans selection:bg-[var(--color-primary)]/30">
            <div className="w-full max-w-md flex flex-col items-center gap-10 rounded-2xl bg-[#141414] border border-white/10 p-10 shadow-2xl relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.02),transparent)] pointer-events-none" />

                <div className="flex flex-col items-center text-center gap-4 relative z-10">
                    <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                        <Terminal size={20} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold tracking-tight text-white uppercase font-outfit">Notify</h1>
                        <p className="text-[12px] font-semibold text-neutral-500 uppercase tracking-widest">Profile Configuration</p>
                    </div>
                    <p className="text-[13px] text-neutral-400 font-medium max-w-[240px] leading-relaxed">
                        Complete your profile to synchronize with your cohort.
                    </p>
                </div>

                <OnboardingForm />

                <div className="text-[10px] font-bold text-neutral-800 uppercase tracking-[0.4em] relative z-10">
                    Notify Intelligent Systems
                </div>
            </div>
        </div>
    )
}
