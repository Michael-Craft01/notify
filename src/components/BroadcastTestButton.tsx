'use client'

import { useState } from 'react'
import { Megaphone, Loader2 } from 'lucide-react'
import { broadcastToEveryone } from '@/app/actions/notifications'

export default function BroadcastTestButton() {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [count, setCount] = useState(0)

    const handleBroadcast = async () => {
        if (!confirm('Broadcast a test notification to ALL subscribers?')) return

        setLoading(true)
        setStatus('idle')
        try {
            const res = await broadcastToEveryone(
                '🔔 Global Test Notification',
                'This is a manual broadcast test from a class representative. Alerts are working!',
                '/'
            )
            if (res.success) {
                setStatus('success')
                setCount(res.sent || 0)
            } else {
                setStatus('error')
                alert(res.error || 'Broadcast failed')
            }
        } catch (err) {
            console.error('Broadcast error:', err)
            setStatus('error')
        } finally {
            setLoading(false)
            setTimeout(() => setStatus('idle'), 5000)
        }
    }

    return (
        <button
            onClick={handleBroadcast}
            disabled={loading}
            className={`h-9 px-3 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                status === 'success' 
                    ? 'bg-green-500/20 border border-green-500/30 text-green-500' 
                    : 'btn-secondary hover:bg-orange/10 hover:text-orange hover:border-orange/30'
            }`}
            title="Broadcast test notification to everyone"
        >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Megaphone size={13} />}
            <span className="hidden sm:inline">
                {status === 'success' ? `Sent to ${count}` : 'Broadcast Test'}
            </span>
        </button>
    )
}
