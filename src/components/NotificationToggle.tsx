'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import { saveSubscription, removeSubscription, sendTestNotification } from '@/app/actions/notifications'

type NotifState = 'idle' | 'subscribing' | 'unsubscribing' | 'testing'

export default function NotificationToggle() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [state, setState] = useState<NotifState>('idle')
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [initializing, setInitializing] = useState(true)
    const [showTooltip, setShowTooltip] = useState(false)
    const [statusMsg, setStatusMsg] = useState<string | null>(null)

    // ── Init: check existing subscription ──────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    setInitializing(false)
                    return
                }

                setPermission(Notification.permission)

                // Register service worker if not already active
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

    // ── Subscribe ───────────────────────────────────────────────────────────
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
            if (!vapidKey) throw new Error('VAPID key missing from environment')

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

            // Send a confirmation push so user sees it working immediately
            setState('testing')
            const testRes = await sendTestNotification()
            if (testRes.error) {
                console.warn('[NotificationToggle] Test notification failed:', testRes.error)
            }
        } catch (err: any) {
            console.error('[NotificationToggle] Subscribe error:', err)
            setStatusMsg(err?.message || 'Failed to enable alerts.')
        } finally {
            setState('idle')
        }
    }

    // ── Unsubscribe ─────────────────────────────────────────────────────────
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

    // ── Not supported ───────────────────────────────────────────────────────
    if (!initializing && !('serviceWorker' in navigator)) {
        return null // Don't render if push isn't supported
    }

    // ── Loading / initializing ──────────────────────────────────────────────
    if (initializing || state !== 'idle') {
        return (
            <div
                className="relative flex items-center gap-2 h-9 px-3 rounded-xl border text-[11px] font-bold"
                style={{
                    background: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-dim)',
                }}
            >
                <Loader2 size={13} className="animate-spin" />
                <span className="hidden sm:inline">
                    {state === 'testing' ? 'Sending test...' :
                     state === 'subscribing' ? 'Enabling...' :
                     state === 'unsubscribing' ? 'Disabling...' : 'Loading...'}
                </span>
            </div>
        )
    }

    // ── Blocked by browser ──────────────────────────────────────────────────
    if (permission === 'denied') {
        return (
            <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div
                    className="flex items-center gap-2 h-9 px-3 rounded-xl border text-[11px] font-bold cursor-not-allowed"
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
                    <Tooltip>
                        Alerts are blocked by your browser. Open site settings and allow notifications to re-enable.
                    </Tooltip>
                )}
            </div>
        )
    }

    // ── Subscribed / Unsubscribed ───────────────────────────────────────────
    return (
        <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <button
                onClick={isSubscribed ? unsubscribe : subscribe}
                className="flex items-center gap-2 h-9 px-3 rounded-xl border text-[11px] font-bold transition-all"
                style={{
                    background: isSubscribed ? 'var(--color-success-soft)' : 'var(--color-surface-2)',
                    borderColor: isSubscribed ? 'hsla(142,70%,45%,0.3)' : 'var(--color-border)',
                    color: isSubscribed ? 'var(--color-success)' : 'var(--color-text-muted)',
                }}
            >
                {isSubscribed ? <CheckCircle2 size={13} /> : <Bell size={13} />}
                <span className="hidden sm:inline">{isSubscribed ? 'Alerts On' : 'Enable Alerts'}</span>
            </button>

            {showTooltip && (
                <Tooltip>
                    {isSubscribed
                        ? 'You receive push alerts 48h, 24h, and 6h before deadlines — even when the app is closed. Click to disable.'
                        : 'Enable deadline alerts. You\'ll get reminders 48h, 24h, and 6h before each task.'}
                </Tooltip>
            )}

            {statusMsg && (
                <div
                    className="absolute right-0 top-full mt-2 w-56 p-3 rounded-xl text-[11px] z-50"
                    style={{
                        background: 'var(--color-danger-soft)',
                        border: '1px solid hsla(4,86%,58%,0.25)',
                        color: 'var(--color-danger)',
                    }}
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
            className="absolute right-0 top-full mt-2 w-58 p-3 rounded-xl text-[11px] leading-relaxed z-50 pointer-events-none"
            style={{
                width: '232px',
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border-hover)',
                boxShadow: 'var(--shadow-md)',
                color: 'var(--color-text-muted)',
            }}
        >
            {children}
        </div>
    )
}
