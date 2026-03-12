'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'
import { saveSubscription } from '@/app/actions/notifications'

export default function NotificationToggle() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
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
            const result = await Notification.requestPermission()
            setPermission(result)
            if (result !== 'granted') {
                alert('Notifications were blocked. Please enable them in your browser settings.')
                setIsLoading(false)
                return
            }

            const urlBase64ToUint8Array = (base64String: string) => {
                const padding = '='.repeat((4 - base64String.length % 4) % 4);
                const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
            };

            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) throw new Error('VAPID public key not found');

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            })

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
                setIsSubscribed(false)
            }
        } catch (error) {
            console.error('Unsubscribe failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) return <div className="h-8 w-8 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center"><Loader2 className="animate-spin text-neutral-500" size={12} /></div>

    if (permission === 'denied') {
        return (
            <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                <ShieldAlert size={12} /> Blocked
            </div>
        )
    }

    return (
        <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
            className={`flex items-center gap-2 h-8 px-3 rounded-lg text-[11px] font-bold transition-all border ${isSubscribed
                ? 'bg-neutral-900/40 border-white/10 text-neutral-400 hover:text-red-500 hover:border-red-500/30'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white hover:text-black active:scale-95'
                }`}
        >
            {isSubscribed ? <ShieldCheck size={12} /> : <Bell size={12} />}
            <span>{isSubscribed ? 'Alerts Active' : 'Enable Alerts'}</span>
        </button>
    )
}
