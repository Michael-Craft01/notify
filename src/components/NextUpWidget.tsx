'use client'

import { useEffect, useState } from 'react'
import { Clock, MapPin, Sparkles, ChevronRight, Ban } from 'lucide-react'
import { toggleScheduleOverride } from '@/app/actions/schedules'

interface Schedule {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    module_name: string
    course_code: string | null
    venue: string | null
}

interface NextUpWidgetProps {
    schedules: Schedule[]
    overrides: any[]
    isRep: boolean
}

export default function NextUpWidget({ schedules, overrides, isRep }: NextUpWidgetProps) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [nextClass, setNextClass] = useState<Schedule | null>(null)
    const [status, setStatus] = useState<'Free' | 'In Transit' | 'Active'>('Free')
    const [isCancelled, setIsCancelled] = useState(false)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const day = currentTime.getDay()
        const timeStr = currentTime.toTimeString().slice(0, 5) // "HH:mm"
        const dateStr = currentTime.toISOString().split('T')[0]

        // Find today's classes
        const todayClasses = schedules
            .filter(s => s.day_of_week === day)
            .sort((a, b) => a.start_time.localeCompare(b.start_time))

        let currentNext = todayClasses.find(s => s.end_time > timeStr)

        // If no more classes today, find first class next available day
        if (!currentNext) {
            // Simple logic: check next 7 days
            for (let i = 1; i <= 7; i++) {
                const nextDay = (day + i) % 7
                const nextDayClasses = schedules.filter(s => s.day_of_week === nextDay)
                if (nextDayClasses.length > 0) {
                    currentNext = nextDayClasses.sort((a, b) => a.start_time.localeCompare(b.start_time))[0]
                    break
                }
            }
        }

        if (currentNext) {
            setNextClass(currentNext)
            
            // Check if cancelled
            const override = overrides.find(o => o.schedule_id === currentNext?.id && o.override_date === dateStr)
            setIsCancelled(override?.is_cancelled || false)

            const startMinutes = timeToMinutes(currentNext.start_time)
            const endMinutes = timeToMinutes(currentNext.end_time)
            const currentMinutes = timeToMinutes(timeStr)

            if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
                setStatus('Active')
            } else if (startMinutes - currentMinutes <= 10 && startMinutes - currentMinutes > 0) {
                setStatus('In Transit')
            } else {
                setStatus('Free')
            }
        } else {
            setNextClass(null)
            setStatus('Free')
        }
    }, [currentTime, schedules, overrides])

    const timeToMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
    }

    const handleCancel = async () => {
        if (!nextClass) return
        const dateStr = currentTime.toISOString().split('T')[0]
        const res = await toggleScheduleOverride(nextClass.id, dateStr, true, "Class cancelled by rep")
        if (res.success) {
            setIsCancelled(true)
        }
    }

    if (!nextClass) return null

    return (
        <section className="animate-fade-up stagger">
            <div className="relative group p-[1px] rounded-[32px] overflow-hidden">
                {/* Radiant Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange/40 via-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 p-6 sm:p-10 bg-[#0c0c0c]/90 backdrop-blur-3xl border border-white/5 rounded-[31px]">
                    {/* Pulsing Ambient Orange Glow */}
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange/20 transition-all duration-700" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-orange/15 transition-all duration-700" />

                    {/* Status Badge */}
                    <div className="absolute top-0 right-0 px-8 py-3 bg-white/5 border-b border-l border-white/10 rounded-bl-3xl backdrop-blur-md">
                        <div className="flex items-center gap-2.5">
                            <span className={`h-2 w-2 rounded-full animate-pulse shadow-[0_0_12px_currentColor] ${
                                isCancelled ? 'text-red-500 bg-red-500' :
                                status === 'In Transit' ? 'text-orange bg-orange' :
                                status === 'Active' ? 'text-orange-bright bg-orange-bright' : 'text-orange-dim bg-orange-dim'
                            }`} />
                            <span className="text-[11px] font-[family-name:var(--font-outfit)] font-black uppercase tracking-[0.2em] text-white/60">
                                {isCancelled ? 'Cancelled' : status === 'In Transit' ? 'In Transit' : status === 'Active' ? 'Live Now' : 'Upcoming'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 relative z-10">
                        {/* Icon Container with Deep Glow */}
                        <div className={`h-20 w-20 rounded-[24px] flex items-center justify-center border transition-all duration-500 ${
                            isCancelled 
                                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                                : 'bg-orange/10 border-orange/20 text-orange shadow-[0_0_40px_rgba(249,115,22,0.15)] group-hover:shadow-[0_0_60px_rgba(249,115,22,0.25)]'
                        }`}>
                            {isCancelled ? <Ban size={36} /> : <Clock size={36} className="group-hover:scale-110 transition-transform duration-500" />}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={14} className="text-orange animate-pulse" />
                                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-orange/60 font-[family-name:var(--font-outfit)]">The Warden Logic</span>
                            </div>
                            <h2 className={`text-3xl sm:text-5xl font-[family-name:var(--font-outfit)] font-black tracking-tighter leading-none ${isCancelled ? 'text-white/10 line-through' : 'text-white'}`}>
                                {nextClass.module_name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-5">
                                {nextClass.course_code && (
                                    <span className="px-3 py-1 rounded-lg bg-orange/10 border border-orange/20 text-sm font-black text-orange-bright tracking-tight italic">
                                        {nextClass.course_code}
                                    </span>
                                )}
                                <span className="flex items-center gap-2 text-sm text-white/40 font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                    <Clock size={16} className="text-orange/60" /> {nextClass.start_time} - {nextClass.end_time}
                                </span>
                                {nextClass.venue && (
                                    <span className="flex items-center gap-2 text-sm text-white/40 font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                        <MapPin size={16} className="text-orange/60" /> {nextClass.venue}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        {isRep && !isCancelled && status !== 'Free' && (
                            <button 
                                onClick={handleCancel}
                                className="h-14 px-8 rounded-2xl border border-orange/20 bg-orange/5 text-orange text-[12px] font-black uppercase tracking-widest hover:bg-orange hover:text-white hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all active:scale-95 duration-300"
                            >
                                Notify Cancellation
                            </button>
                        )}
                        <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 group-hover:text-white group-hover:bg-orange group-hover:border-orange shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <ChevronRight size={24} className="relative z-10" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
