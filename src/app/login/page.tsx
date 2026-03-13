'use client'

import { useState, useEffect, Suspense } from 'react'
import { Loader2, Mail, Terminal } from 'lucide-react'
import { sendOTP, verifyOTP, signInWithOAuth } from './actions'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'options' | 'email' | 'otp'>('options')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const msg = searchParams.get('message')
        if (msg) setError(msg)
    }, [searchParams])

    const handleOAuth = async (provider: 'google' | 'spotify') => {
        setIsLoading(true)
        const result = await signInWithOAuth(provider)
        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        }
    }

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
            router.push('/')
        }
        setIsLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-6 sm:p-24 relative overflow-hidden bg-[var(--color-bg)]">
            <div className="w-full max-w-sm space-y-10 relative z-10 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 shadow-[0_0_24px_rgba(249,115,22,0.40)]">
                        <Terminal size={22} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-extrabold tracking-[0.05em] uppercase text-[var(--color-text-main)]">
                            Notify
                        </h1>
                        <p className="text-[11px] font-bold text-[var(--color-text-dim)] uppercase tracking-[0.15em]">
                            Professional Access
                        </p>
                    </div>
                </div>

                {/* Auth Card */}
                <div className="card p-8 space-y-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="space-y-2 text-center">
                        <h2 className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-text-main)]">
                            {step === 'options' ? 'Continue with' : step === 'email' ? 'Enter Email' : 'Check your inbox'}
                        </h2>
                        <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                            {step === 'options' && 'Select your preferred identity provider.'}
                            {step === 'email' && 'Use your university or primary email.'}
                            {step === 'otp' && 'Enter the 6-digit access code.'}
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 text-[11px] font-bold text-center rounded-xl animate-fade-in bg-[var(--color-danger-soft)] border border-[hsla(4,86%,58%,0.25)] text-[var(--color-danger)]">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        {step === 'options' ? (
                            <>
                                <button
                                    onClick={() => handleOAuth('google')}
                                    disabled={isLoading}
                                    className="btn-secondary w-full h-11 text-[12px] gap-3"
                                    style={{ background: 'rgba(255,255,255,0.06)' }}
                                >
                                    <img src="https://www.google.com/favicon.ico" className="w-[14px] h-[14px]" alt="" />
                                    Continue with Google
                                </button>

                                <div className="relative py-4 flex items-center justify-center">
                                    <div className="absolute w-full h-px bg-[var(--color-border)]" />
                                    <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-[var(--color-text-dim)] bg-[var(--color-bg)] px-3 z-[1]">OR</span>
                                </div>

                                <button
                                    onClick={() => setStep('email')}
                                    disabled={isLoading}
                                    className="btn-ghost w-full h-11 text-[12px] gap-2 border border-[var(--color-border)]"
                                >
                                    <Mail size={14} />
                                    Login with Email
                                </button>
                            </>
                        ) : step === 'email' ? (
                            <form onSubmit={handleSendOTP} className="space-y-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@university.edu"
                                    required
                                    disabled={isLoading}
                                    className="input-field h-11 px-4 text-[12px] font-semibold"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full h-11 text-[12px]"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Send Access Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep('options')}
                                    className="w-full text-center text-[10px] font-bold uppercase tracking-widest pt-2 text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors"
                                >
                                    Back
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    required
                                    autoFocus
                                    disabled={isLoading}
                                    className="input-field h-14 text-center text-3xl font-black tracking-[0.5em]"
                                    style={{ fontFamily: 'var(--font-outfit)' }}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full h-11 text-[12px]"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Sign In'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="w-full text-center text-[10px] font-bold uppercase tracking-widest pt-2 text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-colors"
                                >
                                    Try another email
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1.5 opacity-30 mt-8">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.4em] text-[var(--color-text-main)]">Unified Auth System</p>
                    <div className="flex gap-4">
                        <span className="h-[3px] w-[3px] rounded-full bg-[var(--color-text-main)]" />
                        <span className="h-[3px] w-[3px] rounded-full bg-[var(--color-text-main)]" />
                        <span className="h-[3px] w-[3px] rounded-full bg-[var(--color-text-main)]" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]"><Loader2 className="animate-spin" /></div>}>
            <LoginContent />
        </Suspense>
    )
}
