'use client'

import { useEffect, useState } from 'react'
import { Clock, MapPin, ChevronRight, Ban, Zap, Timer } from 'lucide-react'
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
    const [timeLeft, setTimeLeft] = useState<string | null>(null)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
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
            const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
            const currentSeconds = currentTime.getSeconds()

            if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
                setStatus('Active')
                // Countdown to end
                const secsLeft = (endMinutes - currentMinutes) * 60 - currentSeconds
                setTimeLeft(formatSeconds(secsLeft))
            } else if (startMinutes - currentMinutes > 0 && startMinutes - currentMinutes <= 60 && override?.override_date === dateStr) {
                 // Within 1 hour on the SAME DAY -> countdown to start
                 const secsLeft = (startMinutes - currentMinutes) * 60 - currentSeconds
                 setTimeLeft(formatSeconds(secsLeft))
                 if (startMinutes - currentMinutes <= 15) setStatus('In Transit')
                 else setStatus('Free')
            } else if (startMinutes - currentMinutes > 0 && startMinutes - currentMinutes <= 60) {
                 // Within 1 hour of ANY day, wait, if currentNext is today, it's correct.
                 const isToday = currentNext.day_of_week === day
                 if (isToday) {
                     const secsLeft = (startMinutes - currentMinutes) * 60 - currentSeconds
                     setTimeLeft(formatSeconds(secsLeft))
                     if (startMinutes - currentMinutes <= 15) setStatus('In Transit')
                     else setStatus('Free')
                 } else {
                     setStatus('Free')
                     setTimeLeft(null)
                 }
            } else {
                setStatus('Free')
                setTimeLeft(null)
            }
        } else {
            setNextClass(null)
            setStatus('Free')
            setTimeLeft(null)
        }
    }, [currentTime, schedules, overrides])

    const formatSeconds = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

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
        <section className={`animate-fade-up stagger ${status !== 'Free' && !isCancelled ? 'animate-pulse [animation-duration:3s]' : ''}`}>
            <div className={`relative group p-[2px] rounded-[32px] overflow-hidden ${status !== 'Free' && !isCancelled ? 'shadow-[0_0_80px_rgba(249,115,22,0.4)]' : ''} transition-shadow duration-700`}>
                {/* ── Animated Background Gradient ───────────────────────────── */}
                <div className={`absolute inset-0 transition-all duration-700 blur-[0.5px] ${
                    isCancelled ? 'bg-gradient-to-br from-red-500/30 to-red-900/40' :
                    status === 'Active' ? 'bg-gradient-to-br from-orange via-orange/60 to-red-500 animate-gradient-xy' :
                    status === 'In Transit' ? 'bg-gradient-to-br from-yellow-500/80 via-orange/70 to-orange/40' :
                    'bg-gradient-to-br from-orange/60 via-orange/20 to-orange/40'
                }`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent_60%)] opacity-30 mix-blend-overlay pointer-events-none" />
                
                <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-8 p-6 sm:p-12 bg-[#050505]/90 backdrop-blur-3xl border border-white/20 rounded-[30px] shadow-inner">
                    
                    {/* ── Ambient Glows ────────────────────────────────────────── */}
                    {status !== 'Free' && !isCancelled && (
                        <>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
                            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
                        </>
                    )}

                    {/* ── Status Ribbon ────────────────────────────────────────── */}
                    <div className="absolute top-0 right-8 sm:right-12 px-6 py-2.5 border-x border-b border-white/10 rounded-b-2xl backdrop-blur-3xl z-20 shadow-xl overflow-hidden"
                         style={{ background: isCancelled ? 'rgba(239, 68, 68, 0.2)' : status === 'Active' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255, 255, 255, 0.05)' }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50 pointer-events-none" />
                        <div className="flex items-center gap-3 relative z-10">
                            <span className={`h-2.5 w-2.5 rounded-full shadow-[0_0_20px_currentColor] ${
                                isCancelled ? 'text-red-500 bg-red-500' :
                                status === 'In Transit' ? 'text-yellow-400 bg-yellow-400 animate-ping' :
                                status === 'Active' ? 'text-green-400 bg-green-400 animate-pulse' : 'text-orange bg-orange'
                            }`} />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] font-[family-name:var(--font-outfit)] text-white drop-shadow-md">
                                {isCancelled ? 'Cancelled' : status === 'In Transit' ? 'Starts Soon' : status === 'Active' ? 'Live Now' : 'Next Up'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 relative z-10 w-full">
                        {/* ── Big Icon Container ─────────────────────────────────── */}
                        <div className={`relative shrink-0 transition-transform duration-700 ${status !== 'Free' ? 'scale-110' : 'group-hover:scale-105'}`}>
                             <div className={`h-24 w-24 sm:h-32 sm:w-32 rounded-[32px] sm:rounded-[40px] flex items-center justify-center border-2 transition-all duration-500 overflow-hidden ${
                                isCancelled 
                                    ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                    : status === 'Active'
                                    ? 'bg-orange/30 border-orange/50 text-white shadow-[0_0_80px_rgba(249,115,22,0.6)]'
                                    : 'bg-orange/10 border-orange/30 text-orange shadow-[0_0_40px_rgba(249,115,22,0.2)]'
                            }`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                                {isCancelled ? <Ban size={48} /> : status === 'Active' ? <Zap size={56} className="relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" /> : <Clock size={48} className="relative z-10" />}
                            </div>
                            
                            {/* Orbital Rings for Urgency */}
                            {!isCancelled && status !== 'Free' && (
                                <>
                                    <div className="absolute -inset-4 border border-orange/30 rounded-[50px] animate-[spin_4s_linear_infinite]" />
                                    <div className="absolute -inset-8 border border-white/10 rounded-[60px] animate-[spin_8s_linear_infinite_reverse]" />
                                </>
                            )}
                        </div>

                        {/* ── Text Content ───────────────────────────────────────── */}
                        <div className="flex-1 space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="h-[2px] w-12 bg-white/40 rounded-full" />
                                <span className={`text-[13px] font-black uppercase tracking-[0.4em] px-3 py-1 rounded-full font-[family-name:var(--font-outfit)] backdrop-blur-md border ${
                                    status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                                    status === 'In Transit' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    isCancelled ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-orange/10 text-orange border-orange/20'
                                }`}>
                                    The Warden
                                </span>
                            </div>

                            <div className="flex flex-col xl:flex-row xl:items-end gap-4 xl:gap-8 justify-between w-full">
                                <h2 className={`text-4xl sm:text-6xl font-[family-name:var(--font-outfit)] font-black tracking-tighter leading-[0.9] max-w-xl ${isCancelled ? 'text-white/20 line-through' : 'text-white drop-shadow-lg'}`}>
                                    {nextClass.module_name}
                                    <span className={status === 'Active' ? 'text-white' : 'text-orange'}>.</span>
                                </h2>

                                {/* ── Live Countdown Timer ──────────────────────────── */}
                                {timeLeft && !isCancelled && (
                                    <div className="shrink-0 flex items-center gap-3 bg-black/40 border border-white/10 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-xl">
                                        <Timer className={status === 'Active' ? 'text-orange animate-pulse' : 'text-yellow-500 animate-spin-slow'} size={24} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-none mb-1">
                                                {status === 'Active' ? 'Ends In' : 'Starts In'}
                                            </span>
                                            <span className="text-3xl font-[family-name:var(--font-outfit)] font-black tracking-widest text-white leading-none tabular-nums">
                                                {timeLeft}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                {nextClass.course_code && (
                                    <span className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange to-orange-bright text-[14px] font-black text-black uppercase tracking-widest shadow-[0_4px_20px_rgba(249,115,22,0.4)]">
                                        {nextClass.course_code}
                                    </span>
                                )}
                                <div className="flex items-center gap-6 p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <span className={`flex items-center gap-3 text-[15px] font-bold px-5 py-2 rounded-xl bg-white/5 ${status === 'Active' ? 'text-white' : 'text-white/70'}`}>
                                        <Clock size={20} className={status === 'Active' ? 'text-orange animate-pulse' : 'text-orange'} /> 
                                        {nextClass.start_time} - {nextClass.end_time}
                                    </span>
                                    <div className="w-[1px] h-6 bg-white/20" />
                                    <span className="flex items-center gap-3 text-[15px] text-white/70 font-bold px-5 py-2">
                                        <MapPin size={20} className="text-orange" /> {nextClass.venue || "TBA"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Actions ───────────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 shrink-0 mt-6 sm:mt-0 xl:pl-8">
                        {isRep && !isCancelled && status !== 'Free' && (
                            <button 
                                onClick={handleCancel}
                                className="w-full sm:w-auto h-16 sm:h-20 px-8 rounded-[24px] border-2 border-red-500/30 bg-red-500/10 text-red-400 text-[14px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 shadow-lg hover:shadow-[0_0_50px_rgba(239,68,68,0.5)] transition-all active:scale-95 duration-500 group/btn backdrop-blur-md"
                            >
                                <span className="flex items-center justify-center gap-3">
                                    <Ban size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                    Cancel Class
                                </span>
                            </button>
                        )}
                        <button className="relative h-16 w-16 sm:h-24 sm:w-24 rounded-[30px] bg-gradient-to-br from-white to-white/80 flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-all duration-500 shadow-[0_10px_50px_rgba(255,255,255,0.3)] group/arrow">
                            <div className="absolute inset-0 bg-orange opacity-0 group-hover/arrow:opacity-20 transition-opacity rounded-[30px]" />
                            <ChevronRight size={40} strokeWidth={3} className="group-hover/arrow:translate-x-1.5 transition-transform" />
                        </button>
                    </div>

                </div>
            </div>
        </section>
    )
}
