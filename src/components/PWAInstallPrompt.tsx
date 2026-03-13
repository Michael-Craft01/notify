'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e)
            // Update UI notify the user they can install the PWA
            setShowPrompt(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Check if already installed
        window.addEventListener('appinstalled', () => {
            setShowPrompt(false)
            setDeferredPrompt(null)
        })

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setShowPrompt(false)
        }

        setDeferredPrompt(null)
    }

    if (!showPrompt) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up w-[calc(100%-48px)] sm:w-auto">
            <div className="bg-[#111] border border-[var(--color-border)] p-3 pr-4 rounded-2xl shadow-2xl flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 shadow-md">
                    <Image src="/favicon.png" alt="Notify Logo" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[13px] font-bold text-white leading-tight">Install Notify</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] truncate">Get the full app experience</p>
                </div>
                <button
                    onClick={handleInstallClick}
                    className="h-8 px-4 rounded-lg bg-[var(--orange)] hover:bg-[var(--orange-bright)] text-white text-[12px] font-bold transition-colors shrink-0"
                >
                    Install
                </button>
                <button
                    onClick={() => setShowPrompt(false)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-text-dim)] hover:text-white hover:bg-[var(--color-surface-2)] transition-colors shrink-0 ml-1"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}
