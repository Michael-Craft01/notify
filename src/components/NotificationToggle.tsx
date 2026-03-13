'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { saveSubscription, removeSubscription, sendTestNotification } from '@/app/actions/notifications'

type NotifState = 'idle' | 'subscribing' | 'unsubscribing' | 'testing'

export default function NotificationToggle() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [state, setState] = useState<NotifState>('idle')
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [initializing, setInitializing] = useState(true)
    const [showTooltip, setShowTooltip] = useState(false)
    const [statusMsg, setStatusMsg] = useState<string | null>(null)

    useEffect(() => {
        const init = async () => {
            try {
                console.log('[NotificationToggle] Checking SW support...')
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    console.log('[NotificationToggle] SW or Push not supported.')
                    setInitializing(false)
                    return
                }

                setPermission(Notification.permission)
                console.log('[NotificationToggle] Current permission:', Notification.permission)

                // Try to register, but don't hang if it's already managed by next-pwa
                console.log('[NotificationToggle] Registering SW...')
                const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
                console.log('[NotificationToggle] SW registered:', registration.scope)

                const reg = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 5000))
                ]) as ServiceWorkerRegistration
                
                console.log('[NotificationToggle] SW ready.')
                const sub = await reg.pushManager.getSubscription()
                console.log('[NotificationToggle] Existing sub:', !!sub)
                setIsSubscribed(!!sub)
            } catch (err) {
                console.warn('[NotificationToggle] Init warning/error:', err)
            } finally {
                setInitializing(false)
            }
        }
        init()
    }, [])

    const subscribe = async () => {
        setState('subscribing')
        setStatusMsg(null)

        try {
            console.log('[NotificationToggle] Requesting permission...')
            const perm = await Notification.requestPermission()
            setPermission(perm)
            console.log('[NotificationToggle] Permission result:', perm)

            if (perm !== 'granted') {
                setStatusMsg('Permission denied. Enable in browser settings.')
                setState('idle')
                return
            }

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            console.log('[NotificationToggle] VAPID key present:', !!vapidKey)
            if (!vapidKey) throw new Error('VAPID key missing. Check environment variables.')

            const urlBase64ToUint8Array = (base64: string) => {
                const padding = '='.repeat((4 - (base64.length % 4)) % 4)
                const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
                const raw = window.atob(b64)
                return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
            }

            console.log('[NotificationToggle] Waiting for SW ready...')
            const reg = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Browser stall: Service Worker not responding.')), 10000))
            ]) as ServiceWorkerRegistration

            console.log('[NotificationToggle] Subscribing via PushManager...')
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            })

            console.log('[NotificationToggle] Saving sub to DB...')
            const subData = JSON.parse(JSON.stringify(sub))
            subData.origin = window.location.origin
            const res = await saveSubscription(subData)

            if (res.error) {
                console.error('[NotificationToggle] DB save error:', res.error)
                setStatusMsg(res.error)
                setState('idle')
                return
            }

            console.log('[NotificationToggle] Subscription successful. Sending test...')
            setIsSubscribed(true)
            setState('testing')
            await sendTestNotification()
            console.log('[NotificationToggle] Test sequence complete.')
        } catch (err: any) {
            console.error('[NotificationToggle] Subscribe sequence failed:', err)
            setStatusMsg(err?.message || 'Failed to enable alerts.')
        } finally {
            setState('idle')
        }
    }

    const unsubscribe = async () => {
        setState('unsubscribing')
        setStatusMsg(null)
        try {
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.getSubscription()

            if (sub) {
                const endpoint = sub.endpoint
                await sub.unsubscribe()
                await removeSubscription(endpoint)
            }

            setIsSubscribed(false)
        } catch (err: any) {
            console.error('[NotificationToggle] Unsubscribe error:', err)
            setStatusMsg('Could not fully disable alerts.')
        } finally {
            setState('idle')
        }
    }

    if (!initializing && !('serviceWorker' in navigator)) {
        return null
    }

    if (initializing || state !== 'idle') {
        return (
            <div className="btn-secondary h-9 px-3 rounded-xl pointer-events-none text-[11px]">
                <Loader2 size={13} className="animate-spin" />
                <span className="hidden sm:inline">
                    {state === 'testing' ? 'Testing...' :
                     state === 'subscribing' ? 'Enabling...' :
                     state === 'unsubscribing' ? 'Disabling...' : 'Loading...'}
                </span>
            </div>
        )
    }

    if (permission === 'denied') {
        return (
            <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div
                    className="flex items-center gap-2 h-9 px-3 rounded-xl border text-[11px] font-bold cursor-not-allowed bg-white/5 border-white/10 text-[var(--color-text-dim)]"
                >
                    <AlertCircle size={13} />
                    <span className="hidden sm:inline">Blocked</span>
                </div>
                {showTooltip && (
                    <FixedTooltip>Alerts are blocked by your browser. Open site settings to allow notifications.</FixedTooltip>
                )}
            </div>
        )
    }

    return (
        <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <button
                onClick={isSubscribed ? unsubscribe : subscribe}
                className={`h-9 px-3 rounded-xl text-[11px] font-bold transition-all ${
                    isSubscribed 
                        ? 'flex items-center gap-1.5 bg-[var(--color-primary-soft)] border border-[var(--color-primary-border)] text-[var(--orange-bright)] drop-shadow-[0_0_8px_rgba(249,115,22,0.4)] shadow-[0_0_12px_rgba(249,115,22,0.15)] hover:scale-[1.02] active:scale-[0.98]' 
                        : 'btn-secondary hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
                {isSubscribed ? <CheckCircle2 size={13} /> : <Bell size={13} />}
                <span className="hidden sm:inline">{isSubscribed ? 'Alerts On' : 'Enable Alerts'}</span>
            </button>

            {showTooltip && (
                <FixedTooltip>
                    {isSubscribed
                        ? 'Push alerts enabled (48h, 24h, 6h before deadlines). Click to disable.'
                        : 'Enable deadline alerts. Get notified 48h, 24h, and 6h before tasks are due.'}
                </FixedTooltip>
            )}

            {statusMsg && (
                <div className="fixed inset-0 z-[400] flex items-end justify-center p-4 pb-24 sm:pb-32 pointer-events-none">
                    <div className="animate-fade-up bg-[var(--color-surface-3)] border border-[var(--color-border)] text-[var(--color-text-main)] px-5 py-3 rounded-2xl text-[12px] font-bold shadow-2xl backdrop-blur-xl pointer-events-auto max-w-[320px] text-center">
                        {statusMsg}
                    </div>
                </div>
            )}
        </div>
    )
}

function FixedTooltip({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-[400] flex items-end justify-center p-4 pb-24 pointer-events-none">
            <div className="animate-fade-up bg-[#070707]/95 backdrop-blur-[20px] border border-white/10 shadow-2xl text-white/60 px-4 py-2.5 rounded-xl text-[11px] leading-relaxed max-w-[280px] text-center">
                {children}
            </div>
        </div>
    )
}
