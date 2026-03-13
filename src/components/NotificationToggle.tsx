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
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    setInitializing(false)
                    return
                }

                setPermission(Notification.permission)

                await navigator.serviceWorker.register('/sw.js', { scope: '/' })
                const reg = await navigator.serviceWorker.ready
                const sub = await reg.pushManager.getSubscription()
                setIsSubscribed(!!sub)
            } catch (err) {
                console.error('[NotificationToggle] Init error:', err)
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
            const perm = await Notification.requestPermission()
            setPermission(perm)

            if (perm !== 'granted') {
                setStatusMsg('Permission denied. Enable in browser settings.')
                setState('idle')
                return
            }

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidKey) throw new Error('VAPID key missing')

            const urlBase64ToUint8Array = (base64: string) => {
                const padding = '='.repeat((4 - (base64.length % 4)) % 4)
                const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
                const raw = window.atob(b64)
                return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
            }

            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            })

            const res = await saveSubscription(JSON.parse(JSON.stringify(sub)))

            if (res.error) {
                setStatusMsg(res.error)
                setState('idle')
                return
            }

            setIsSubscribed(true)
            setState('testing')
            await sendTestNotification()
        } catch (err: any) {
            console.error('[NotificationToggle] Subscribe error:', err)
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
                    <Tooltip>Alerts are blocked by your browser. Open site settings to allow notifications.</Tooltip>
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
                <Tooltip>
                    {isSubscribed
                        ? 'Push alerts enabled (48h, 24h, 6h before deadlines). Click to disable.'
                        : 'Enable deadline alerts. Get notified 48h, 24h, and 6h before tasks are due.'}
                </Tooltip>
            )}

            {statusMsg && (
                <div
                    className="absolute right-0 top-full mt-2 w-56 p-3 rounded-xl text-[11px] z-50 animate-fade-in bg-[var(--color-surface-3)] border border-[var(--color-border)] text-[var(--color-text-main)]"
                >
                    {statusMsg}
                </div>
            )}
        </div>
    )
}

function Tooltip({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="absolute right-0 top-full mt-2 w-[232px] p-3 rounded-xl text-[11px] leading-relaxed z-50 animate-fade-in pointer-events-none bg-[#070707]/95 backdrop-blur-[20px] border border-[var(--color-border)] shadow-md text-[var(--color-text-muted)]"
        >
            {children}
        </div>
    )
}
