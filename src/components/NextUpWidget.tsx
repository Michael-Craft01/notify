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
            <div className="relative group p-[1.5px] rounded-[32px] overflow-hidden">
                {/* ── Animated Background Gradient ───────────────────────────── */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange/60 via-orange/20 to-orange/40 opacity-100 transition-all duration-700 blur-[0.5px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.4),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-8 p-6 sm:p-12 bg-[#080808]/95 backdrop-blur-3xl border border-white/10 rounded-[31px] shadow-[0_0_50px_rgba(249,115,22,0.1)]">
                    
                    {/* ── Ambient Glows ────────────────────────────────────────── */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-orange/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
                    <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange/20 transition-all duration-700" />

                    {/* ── Status Ribbon ────────────────────────────────────────── */}
                    <div className="absolute top-0 right-12 px-6 py-2.5 bg-orange/10 border-x border-b border-orange/20 rounded-b-2xl backdrop-blur-xl z-20">
                        <div className="flex items-center gap-2.5">
                            <span className={`h-2 w-2 rounded-full animate-pulse shadow-[0_0_15px_currentColor] ${
                                isCancelled ? 'text-red-500 bg-red-500' :
                                status === 'In Transit' ? 'text-yellow-400 bg-yellow-400' :
                                status === 'Active' ? 'text-orange-bright bg-orange-bright' : 'text-orange bg-orange'
                            }`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80 font-[family-name:var(--font-outfit)]">
                                {isCancelled ? 'Cancelled' : status === 'In Transit' ? 'In Transit' : status === 'Active' ? 'In Session' : 'Next Up'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 relative z-10 w-full">
                        {/* ── Big Icon Container ─────────────────────────────────── */}
                        <div className={`relative shrink-0 group-hover:scale-105 transition-transform duration-700`}>
                             <div className={`h-24 w-24 rounded-[32px] flex items-center justify-center border-2 transition-all duration-500 overflow-hidden ${
                                isCancelled 
                                    ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                                    : 'bg-orange/20 border-orange/30 text-orange shadow-[0_0_60px_rgba(249,115,22,0.2)]'
                            }`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                                {isCancelled ? <Ban size={42} /> : <Clock size={42} className="relative z-10" />}
                            </div>
                            {/* Orbital Ring */}
                            {!isCancelled && (
                                <div className="absolute -inset-4 border border-orange/10 rounded-[40px] animate-[spin_10s_linear_infinite]" />
                            )}
                        </div>

                        {/* ── Text Content ───────────────────────────────────────── */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-[1px] w-8 bg-orange/30" />
                                <span className="text-[12px] font-black uppercase tracking-[0.4em] text-orange bg-orange/10 px-3 py-0.5 rounded-full font-[family-name:var(--font-outfit)]">
                                    The Warden
                                </span>
                            </div>

                            <h2 className={`text-4xl sm:text-6xl font-[family-name:var(--font-outfit)] font-black tracking-tighter leading-[0.9] ${isCancelled ? 'text-white/20 line-through' : 'text-white'}`}>
                                {nextClass.module_name}
                                <span className="text-orange">.</span>
                            </h2>

                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                {nextClass.course_code && (
                                    <span className="px-4 py-1.5 rounded-xl bg-orange text-[13px] font-black text-black uppercase tracking-tight shadow-[0_4px_20px_rgba(249,115,22,0.3)]">
                                        {nextClass.course_code}
                                    </span>
                                )}
                                <div className="flex items-center gap-6 p-1 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
                                    <span className="flex items-center gap-2.5 text-[14px] text-white/60 font-bold px-4 py-1.5">
                                        <Clock size={18} className="text-orange" /> {nextClass.start_time} - {nextClass.end_time}
                                    </span>
                                    <div className="w-[1px] h-6 bg-white/10" />
                                    <span className="flex items-center gap-2.5 text-[14px] text-white/60 font-bold px-4 py-1.5">
                                        <MapPin size={18} className="text-orange" /> {nextClass.venue || "TBA"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Actions ───────────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 shrink-0">
                        {isRep && !isCancelled && status !== 'Free' && (
                            <button 
                                onClick={handleCancel}
                                className="w-full sm:w-auto h-16 px-10 rounded-[24px] border border-red-500/20 bg-red-500/5 text-red-500 text-[13px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-all active:scale-95 duration-500 group/btn"
                            >
                                <span className="flex items-center gap-2">
                                    <Ban size={16} className="group-hover/btn:rotate-12 transition-transform" />
                                    Cancel Today
                                </span>
                            </button>
                        )}
                        <button className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-[28px] bg-orange flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-all duration-500 shadow-[0_10px_40px_rgba(249,115,22,0.3)] group/arrow">
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/arrow:opacity-100 transition-opacity rounded-[28px]" />
                            <ChevronRight size={32} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                </div>
            </div>
        </section>
    )
}
