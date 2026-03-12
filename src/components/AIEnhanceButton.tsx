'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Zap } from 'lucide-react'
import { enhanceFormAction } from '@/app/actions/oracle'

interface AIEnhanceButtonProps {
    formData: Record<string, string>
    onEnhance: (data: Record<string, string>) => void
    label?: string
    variant?: 'mini' | 'standard'
    tooltip?: string
}

export default function AIEnhanceButton({
    formData,
    onEnhance,
    label = "NotifyAI",
    variant = 'standard',
    tooltip = "Ask Oracle to complete this field"
}: AIEnhanceButtonProps) {
    const [isPending, setIsPending] = useState(false)

    const handleEnhance = async () => {
        const hasInput = Object.values(formData).some(val => val.trim().length > 0)
        if (!hasInput) return

        setIsPending(true)
        try {
            const result = await enhanceFormAction(formData)
            if (result.success && result.data) {
                onEnhance(result.data)
            }
        } catch (error) {
            console.error("Enhancement error:", error)
        } finally {
            setIsPending(false)
        }
    }

    if (variant === 'mini') {
        return (
            <button
                type="button"
                onClick={handleEnhance}
                disabled={isPending}
                title={tooltip}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-all disabled:opacity-30 border border-[var(--color-primary)]/20 shadow-sm"
            >
                {isPending ? (
                    <Loader2 size={10} className="animate-spin" />
                ) : (
                    <Sparkles size={10} className="animate-pulse" />
                )}
                <span className="text-[9px] font-black uppercase tracking-tighter">AI</span>
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={handleEnhance}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-orange-400 text-[10px] font-black text-white uppercase tracking-widest shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
        >
            {isPending ? (
                <Loader2 size={12} className="animate-spin text-white" />
            ) : (
                <Zap size={10} fill="white" />
            )}
            <span>{label}</span>
        </button>
    )
}
