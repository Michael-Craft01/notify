'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { saveSubscription } from '@/app/actions/notifications'

export default function NotificationToggle() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [showTooltip, setShowTooltip] = useState(false)

    useEffect(() => {
        const check = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                setIsLoading(false)
                return
            }
            setPermission(Notification.permission)
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.getSubscription()
            setIsSubscribed(!!sub)
            setIsLoading(false)
        }
        check()
    }, [])

    const subscribe = async () => {
        setIsLoading(true)
        try {
            const reg = await navigator.serviceWorker.ready
            const result = await Notification.requestPermission()
            setPermission(result)

            if (result !== 'granted') {
                alert('Enable notifications in your browser settings to receive deadline alerts.')
                setIsLoading(false)
                return
            }

            const urlBase64ToUint8Array = (base64: string) => {
                const padding = '='.repeat((4 - base64.length % 4) % 4)
                const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
                const raw = window.atob(b64)
                return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
            }

            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidKey) throw new Error('VAPID key missing')

            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            })

            const res = await saveSubscription(JSON.parse(JSON.stringify(sub)))
            if (res.error) {
                alert(res.error)
            } else {
                setIsSubscribed(true)
            }
        } catch (err) {
            console.error('Push registration failed:', err)
            alert('Could not enable notifications. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const unsubscribe = async () => {
        setIsLoading(true)
        try {
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.getSubscription()
            if (sub) await sub.unsubscribe()
            setIsSubscribed(false)
        } catch (err) {
            console.error('Unsubscribe failed:', err)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div
                className="h-9 w-9 rounded-xl flex items-center justify-center border"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
            >
                <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-text-dim)' }} />
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
                    className="flex items-center gap-2 h-9 px-3 rounded-xl border text-[11px] font-bold uppercase tracking-wide cursor-not-allowed"
                    style={{
                        background: 'var(--color-danger-soft)',
                        borderColor: 'hsla(4,86%,58%,0.25)',
                        color: 'var(--color-danger)',
                    }}
                >
                    <AlertCircle size={13} />
                    <span className="hidden sm:inline">Blocked</span>
                </div>
                {showTooltip && (
                    <div
                        className="absolute right-0 top-full mt-2 w-52 p-3 rounded-xl text-[11px] leading-relaxed z-50"
                        style={{
                            background: 'var(--color-surface-3)',
                            border: '1px solid var(--color-border-hover)',
                            boxShadow: 'var(--shadow-md)',
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        Notifications are blocked. Open browser settings to re-enable them.
                    </div>
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
                disabled={isLoading}
                className="flex items-center gap-2 h-9 px-3 rounded-xl border text-[11px] font-bold transition-all uppercase tracking-wide"
                style={{
                    background: isSubscribed ? 'var(--color-success-soft)' : 'var(--color-surface-2)',
                    borderColor: isSubscribed ? 'hsla(142,70%,45%,0.3)' : 'var(--color-border)',
                    color: isSubscribed ? 'var(--color-success)' : 'var(--color-text-muted)',
                }}
            >
                {isSubscribed
                    ? <CheckCircle2 size={13} />
                    : <Bell size={13} />
                }
                <span className="hidden sm:inline">
                    {isSubscribed ? 'Alerts On' : 'Alerts Off'}
                </span>
            </button>

            {showTooltip && (
                <div
                    className="absolute right-0 top-full mt-2 w-52 p-3 rounded-xl text-[11px] leading-relaxed z-50"
                    style={{
                        background: 'var(--color-surface-3)',
                        border: '1px solid var(--color-border-hover)',
                        boxShadow: 'var(--shadow-md)',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    {isSubscribed
                        ? 'Receiving deadline alerts: 48h, 24h, and 6h before due dates. Click to disable.'
                        : 'Enable push notifications to receive deadline alerts even when the app is closed.'}
                </div>
            )}
        </div>
    )
}
