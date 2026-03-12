'use client'

import { useState } from 'react'
import { BellRing, Loader2, ArrowLeft } from 'lucide-react'
import { sendOTP, verifyOTP } from './actions'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const result = await sendOTP(email)
        if (result.error) {
            setError(result.error)
        } else {
            setStep('otp')
        }
        setIsLoading(false)
    }

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const result = await verifyOTP(email, otp)
        if (result.error) {
            setError(result.error)
        } else {
            // Success! The server action handles revalidation, 
            // we just need to push to home.
            router.push('/')
        }
        setIsLoading(false)
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--color-background)]">
            <div className="w-full max-w-sm flex flex-col items-center gap-6 rounded-2xl bg-[var(--color-surface)] p-8 shadow-xl border border-[var(--color-surface-hover)]">

                <div className="flex flex-col items-center text-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-white shadow-lg mb-2">
                        <BellRing size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-main)]">Notify</h1>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        {step === 'email' ? 'Authenticate to access the Warden.' : 'Enter the 6-digit code sent to your email.'}
                    </p>
                </div>

                {error && (
                    <div className="w-full rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 font-medium text-center">
                        {error}
                    </div>
                )}

                {step === 'email' ? (
                    <form onSubmit={handleSendOTP} className="w-full flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-[var(--color-text-main)]">
                                University Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="student@university.edu"
                                required
                                disabled={isLoading}
                                className="rounded-lg border border-[var(--color-surface-hover)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 w-full flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Access Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="w-full flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="otp" className="text-sm font-medium text-[var(--color-text-main)]">
                                6-Digit Code
                            </label>
                            <input
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="· · · · · ·"
                                required
                                autoFocus
                                disabled={isLoading}
                                className="rounded-lg border border-[var(--color-surface-hover)] bg-[var(--color-background)] px-4 py-2.5 text-center text-xl font-bold tracking-[0.5em] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 w-full flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Enter'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('email')}
                            className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                        >
                            <ArrowLeft size={14} /> Back to email
                        </button>
                    </form>
                )}

                <p className="text-center text-xs text-[var(--color-text-muted)]">
                    Only strict university domains are accepted. Access is heavily monitored.
                </p>
            </div>
        </div>
    )
}
