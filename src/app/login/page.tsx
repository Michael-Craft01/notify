'use client'

import { useState, useEffect, Suspense } from 'react'
import { Loader2, Mail, Terminal, Sparkles, TrendingUp, Users } from 'lucide-react'
import { sendOTP, verifyOTP } from './actions'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

function LoginContent() {
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState<'options' | 'email' | 'otp'>('options')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        const msg = searchParams.get('message')
        if (msg) setError(msg)
    }, [searchParams])

    const handleOAuth = async (provider: 'google') => {
        setIsLoading(true)
        setError(null)
        try {
            const { signInWithOAuth } = await import('./actions')
            const result = await signInWithOAuth(provider)
            if (result?.error) {
                setError(result.error)
                setIsLoading(false)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to initiate login')
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
        <div className="min-h-screen bg-[#050505] text-white selection:bg-orange/30 selection:text-orange overflow-x-hidden">
            {/* ── IMMERSIVE BACKGROUND ────────────────────────────────────────── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.02] sm:opacity-[0.03] flex items-center justify-center">
                <img
                    src="/favicon.png"
                    className="w-[150vw] h-[150vw] sm:w-[120vw] sm:h-[120vw] max-w-none object-contain animate-pulse duration-[10s]"
                    alt=""
                />
            </div>

            <div className="fixed top-[-10%] left-[-10%] w-[70%] h-[70%] sm:w-[50%] sm:h-[50%] bg-orange/10 rounded-full blur-[140px] animate-pulse pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[70%] h-[70%] sm:w-[50%] sm:h-[50%] bg-orange/5 rounded-full blur-[140px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

            {/* ── CONTENT GRID ─────────────────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-2 min-h-screen">

                {/* Left Side: Value Proposition & Details */}
                <div className="flex flex-col justify-center p-8 sm:p-20 xl:p-32 space-y-12 sm:space-y-16 lg:border-r border-white/5 bg-white/[0.01] backdrop-blur-sm">
                    <div className="space-y-4 sm:space-y-6 animate-fade-up">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 shadow-[0_0_32px_rgba(249,115,22,0.4)]">
                            <Terminal size={28} color="#fff" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-4xl sm:text-6xl xl:text-7xl font-[family-name:var(--font-outfit)] font-black tracking-tighter leading-[0.95] sm:leading-[0.9]">
                            Your Schedule,<br />
                            <span className="bg-gradient-to-r from-orange to-orange-400 bg-clip-text text-transparent">Reimagined.</span>
                        </h1>
                        <p className="text-base sm:text-lg text-white/40 max-w-md font-medium leading-relaxed">
                            Notify is more than a tracker. It's an intelligent companion designed to eliminate academic friction.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:gap-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
                        {/* Feature 1: NotifyAI */}
                        <div className="flex gap-4 sm:gap-6 group">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange group-hover:bg-orange/10 group-hover:border-orange/20 transition-all">
                                <Sparkles size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/90">NotifyAI Assistant</h3>
                                <p className="text-[12px] sm:text-[13px] text-white/30 leading-relaxed">Natural language processing to add, update, and query your schedule instantly.</p>
                            </div>
                        </div>

                        {/* Feature 2: Smart Pulse */}
                        <div className="flex gap-4 sm:gap-6 group">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-400/10 group-hover:border-blue-400/20 transition-all">
                                <TrendingUp size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/90">Cohort Momentum</h3>
                                <p className="text-[12px] sm:text-[13px] text-white/30 leading-relaxed">Real-time tracking of collective progress without compromising individual privacy.</p>
                            </div>
                        </div>

                        {/* Feature 3: Professional Sync */}
                        <div className="flex gap-4 sm:gap-6 group">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400/10 group-hover:border-emerald-400/20 transition-all">
                                <Users size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/90">Unified Collaboration</h3>
                                <p className="text-[12px] sm:text-[13px] text-white/30 leading-relaxed">Shared assignment database created and maintained by the student community.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-wrap items-center gap-4 sm:gap-6 animate-fade-up" style={{ animationDelay: '400ms' }}>
                        <div className="flex -space-x-2 sm:-space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-[#0a0a0a] bg-white/10 flex items-center justify-center text-[9px] sm:text-[10px] font-black">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-white/20">
                            Trusted by 100+ Students
                        </p>
                    </div>
                </div>

                {/* Right Side: Auth Portal */}
                <div className="flex items-center justify-center p-6 lg:bg-transparent bg-[#050505]/40 backdrop-blur-md pb-20 lg:pb-6">
                    <div className="w-full max-w-sm space-y-8 sm:space-y-10">
                        <div className="relative">
                            {/* Glass Card */}
                            <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-[32px] opacity-100" />
                            <div className="relative bg-[#0a0a0a]/90 backdrop-blur-3xl p-7 sm:p-10 rounded-[31px] shadow-2xl space-y-6 sm:space-y-8 overflow-hidden transition-all duration-500">

                                {/* Step Indicator */}
                                <div className="space-y-2 text-center">
                                    <h2 className="text-[12px] sm:text-[13px] font-black uppercase tracking-[0.2em] text-white">
                                        {step === 'options' ? 'Initialization' : step === 'email' ? 'Credential Setup' : 'Security Phase'}
                                    </h2>
                                    <p className="text-[10px] sm:text-[11px] font-medium text-white/40 leading-relaxed max-w-[240px] mx-auto">
                                        {step === 'options' && 'Authenticate to access your curated dashboard.'}
                                        {step === 'email' && 'Use your academic or professional email.'}
                                        {step === 'otp' && 'Verify your session with the 6-digit code.'}
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3.5 text-[11px] font-bold text-center rounded-2xl animate-fade-in bg-red-400/10 border border-red-400/20 text-red-400">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-3 sm:space-y-4">
                                    {step === 'options' ? (
                                        <>
                                            <button
                                                onClick={() => handleOAuth('google')}
                                                disabled={isLoading}
                                                className="w-full h-12 flex items-center justify-center gap-3 bg-white text-black rounded-2xl text-[13px] font-black uppercase tracking-tight transition-all active:scale-[0.98] disabled:opacity-50"
                                            >
                                                <img src="https://www.google.com/favicon.ico" className="w-[16px] h-[16px]" alt="" />
                                                Continue with Google
                                            </button>

                                            <div className="relative py-4 sm:py-6 flex items-center justify-center">
                                                <div className="absolute w-full h-[1px] bg-white/5" />
                                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-white/20 bg-[#0a0a0a] px-4 z-[1]">Secure Auth</span>
                                            </div>

                                            <button
                                                onClick={() => setStep('email')}
                                                disabled={isLoading}
                                                className="w-full h-12 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white rounded-2xl text-[13px] font-bold transition-all active:scale-[0.98]"
                                            >
                                                <Mail size={16} className="text-white/40" />
                                                Login with Email
                                            </button>
                                        </>
                                    ) : step === 'email' ? (
                                        <form onSubmit={handleSendOTP} className="space-y-4">
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange transition-colors" size={18} />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="name@provider.com"
                                                    required
                                                    disabled={isLoading}
                                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-[13px] font-semibold text-white focus:border-orange/30 outline-none transition-all placeholder:text-white/10"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full h-12 bg-orange text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-orange/20 transition-all active:scale-[0.98]"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Send Verify Code'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStep('options')}
                                                className="w-full text-center text-[10px] font-black uppercase tracking-[0.3em] pt-2 text-white/20 hover:text-white/60 transition-colors"
                                            >
                                                Go Back
                                            </button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleVerifyOTP} className="space-y-6 sm:space-y-8">
                                            <div className="flex justify-center">
                                                <input
                                                    type="text"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    placeholder="******"
                                                    required
                                                    autoFocus
                                                    disabled={isLoading}
                                                    className="w-full h-14 sm:h-16 bg-transparent text-center text-3xl sm:text-4xl font-black tracking-[0.5em] text-white focus:outline-none placeholder:text-white/5"
                                                    style={{ fontFamily: 'var(--font-outfit)' }}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full h-12 bg-orange text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-orange/20 transition-all active:scale-[0.98]"
                                            >
                                                {isLoading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Establish Session'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStep('email')}
                                                className="w-full text-center text-[10px] font-black uppercase tracking-[0.3em] pt-2 text-white/20 hover:text-white/60 transition-colors"
                                            >
                                                Resend Code
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="flex flex-col items-center gap-3 opacity-30 mt-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em]">Protected by Supabase Auth</p>
                            <div className="flex gap-4">
                                <span className="h-[2px] w-[2px] rounded-full bg-white" />
                                <span className="h-[2px] w-[2px] rounded-full bg-white" />
                                <span className="h-[2px] w-[2px] rounded-full bg-white" />
                            </div>
                        </div>
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
