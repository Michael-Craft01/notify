'use client'

import { useState, useEffect } from 'react'
import { BellRing, Loader2, ArrowLeft, Mail, Shield, Zap, Globe, Lock, Command } from 'lucide-react'
import { sendOTP, verifyOTP, signInWithOAuth } from './actions'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
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
        <div className="flex min-h-screen bg-[#0b0b0b] font-sans selection:bg-[var(--color-primary)]/30">
            {/* Elite Center Auth Portal */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.03),transparent)] pointer-events-none" />

                <div className="w-full max-w-sm space-y-10 relative z-10 animate-fade-in">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            <Command size={20} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-xl font-bold tracking-tight text-white uppercase font-outfit">Notify</h1>
                            <p className="text-[13px] font-medium text-neutral-500 uppercase tracking-widest">Professional Access</p>
                        </div>
                    </div>

                    <div className="p-8 rounded-2xl bg-[#141414] border border-white/10 shadow-2xl space-y-8">
                        <div className="space-y-2 text-center">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                {step === 'options' ? 'Continue with' : step === 'email' ? 'Enter Email' : 'Check your inbox'}
                            </h2>
                            <p className="text-[12px] font-medium text-neutral-500">
                                {step === 'options' && 'Select your preferred identity provider.'}
                                {step === 'email' && 'Use your university or primary email.'}
                                {step === 'otp' && 'Enter the 6-digit code to sign in.'}
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-[11px] text-red-500 font-bold text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            {step === 'options' ? (
                                <>
                                    <button
                                        onClick={() => handleOAuth('google')}
                                        disabled={isLoading}
                                        className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-white px-4 text-[13px] font-bold text-black transition-all hover:bg-neutral-200 active:scale-95 disabled:opacity-50"
                                    >
                                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                                        Continue with Google
                                    </button>

                                    <button
                                        onClick={() => handleOAuth('spotify')}
                                        disabled={isLoading}
                                        className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-[#1DB954] px-4 text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                                    >
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S17.627 0 12 0zm5.508 17.302c-.223.367-.705.485-1.072.262-2.92-1.784-6.596-2.188-10.925-1.199-.418.096-.838-.168-.934-.586-.096-.418.168-.838.586-.934 4.742-1.084 8.79-.62 12.086 1.392.368.223.486.705.259 1.065zm1.47-3.253c-.281.456-.882.603-1.338.322-3.34-2.053-8.432-2.651-12.38-1.453-.514.151-1.064-.143-1.215-.658-.151-.514.143-1.064.658-1.215 4.512-1.368 10.12-.693 13.953 1.662.456.28.602.88.322 1.342zm.126-3.414c-4.008-2.378-10.613-2.597-14.445-1.434-.614.186-1.264-.165-1.451-.78-.186-.615.165-1.265.78-1.452 4.414-1.339 11.722-1.08 16.335 1.657.553.328.739 1.04.409 1.593-.328.552-1.04.739-1.594.411z" />
                                        </svg>
                                        Continue with Spotify
                                    </button>

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center px-2">
                                            <div className="w-full h-px bg-white/5" />
                                        </div>
                                        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.4em]">
                                            <span className="bg-[#141414] px-4 text-neutral-700">or</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStep('email')}
                                        disabled={isLoading}
                                        className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-white/5 border border-white/10 px-4 text-[13px] font-bold text-neutral-300 transition-all hover:bg-white/10 active:scale-95 disabled:opacity-50"
                                    >
                                        <Mail size={16} />
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
                                        className="w-full h-12 rounded-lg border border-white/10 bg-black/40 px-4 text-[13px] text-white placeholder-neutral-700 focus:border-[var(--color-primary)] focus:outline-none transition-all font-semibold"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Send Access Code'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep('options')}
                                        className="w-full text-center text-[11px] font-bold text-neutral-500 uppercase tracking-widest hover:text-white transition-colors"
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
                                        className="w-full h-16 rounded-lg border border-white/10 bg-black/40 px-4 text-center text-3xl font-bold tracking-[0.5em] text-white focus:border-[var(--color-primary)] focus:outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep('email')}
                                        className="w-full text-center text-[11px] font-bold text-neutral-500 uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Try another email
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 opacity-20">
                        <p className="text-[10px] font-bold text-white uppercase tracking-[0.6em]">Unified Proxy Auth System</p>
                        <div className="flex gap-4">
                            <span className="h-1 w-1 rounded-full bg-white" />
                            <span className="h-1 w-1 rounded-full bg-white" />
                            <span className="h-1 w-1 rounded-full bg-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
