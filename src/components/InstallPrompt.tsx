'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e)
            // Update UI notify the user they can install the PWA
            setIsVisible(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false)
        }

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
        console.log(`User response to the install prompt: ${outcome}`)
        
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null)
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[500] w-[calc(100%-2rem)] max-w-[400px] animate-fade-up">
            <div className="bg-[#070707]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange/10 text-orange rounded-xl border border-white/5 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                        <Smartphone size={18} />
                    </div>
                    <div>
                        <h4 className="text-white text-[13px] font-bold">Install Notify</h4>
                        <p className="text-white/40 text-[11px] leading-tight">Add to your home screen for the full app experience.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-black text-[11px] font-black px-4 py-2 rounded-lg hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-1.5"
                    >
                        <Download size={12} strokeWidth={3} />
                        Install
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-white/20 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}
