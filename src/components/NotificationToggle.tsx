'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { saveSubscription } from '@/app/actions/notifications'

export default function NotificationToggle() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        // Check current subscription and permission
        const checkSubscription = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                setIsLoading(false)
                return
            }

            setPermission(Notification.permission)

            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
            setIsLoading(false)
        }

        checkSubscription()
    }, [])

    const subscribe = async () => {
        setIsLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready

            // 1. Request Permission
            const result = await Notification.requestPermission()
            setPermission(result)
            if (result !== 'granted') {
                alert('Notifications were blocked. Please enable them in your browser settings.')
                setIsLoading(false)
                return
            }

            // 2. Register with Browser Push Server
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            })

            // 3. Save to Supabase
            const saveResult = await saveSubscription(JSON.parse(JSON.stringify(subscription)))
            if (saveResult.error) {
                alert(saveResult.error)
            } else {
                setIsSubscribed(true)
            }
        } catch (error) {
            console.error('Push registration failed:', error)
            alert('Could not enable notifications. Try again later.')
        } finally {
            setIsLoading(false)
        }
    }

    const unsubscribe = async () => {
        setIsLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
                await subscription.unsubscribe()
                // In a production app, you'd also delete this from the DB here
                setIsSubscribed(false)
            }
        } catch (error) {
            console.error('Unsubscribe failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) return <Loader2 className="animate-spin text-[var(--color-primary)]" size={20} />

    if (permission === 'denied') {
        return (
            <div className="flex items-center gap-2 text-xs text-red-500 font-medium">
                <BellOff size={14} /> Notifications Blocked
            </div>
        )
    }

    return (
        <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300 ${isSubscribed
                    ? 'bg-[var(--color-surface-hover)] text-white hover:bg-red-500/10 hover:text-red-500 border border-transparent hover:border-red-500/20'
                    : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm'
                }`}
        >
            <Bell size={14} />
            {isSubscribed ? 'Notifications On' : 'Enable Warden Alert'}
        </button>
    )
}
