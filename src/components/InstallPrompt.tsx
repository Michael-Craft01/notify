'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream
        setIsIOS(isIOSDevice)

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsVisible(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Show for iOS if not standalone
        if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(true)
        }

        // Check if already installed (Android/Desktop)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false)
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
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
                        <p className="text-white/40 text-[11px] leading-tight">
                            {isIOS 
                                ? "Tap 'Share' then 'Add to Home Screen'" 
                                : "Add to home screen for the full experience."}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {!isIOS && (
                        <button
                            onClick={handleInstallClick}
                            className="bg-white text-black text-[11px] font-black px-4 py-2 rounded-lg hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center gap-1.5"
                        >
                            <Download size={12} strokeWidth={3} />
                            Install
                        </button>
                    )}
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
