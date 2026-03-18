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
        <section className="animate-fade-up">
            <div className={`relative group p-[1px] rounded-[20px] overflow-hidden transition-shadow duration-500`}>
                {/* ── Subtle Background Gradient ───────────────────────────── */}
                <div className={`absolute inset-0 transition-opacity duration-700 opacity-70 ${
                    isCancelled ? 'bg-gradient-to-r from-red-500/30 to-transparent' :
                    status === 'Active' ? 'bg-gradient-to-r from-orange/50 via-orange/20 to-transparent animate-pulse' :
                    status === 'In Transit' ? 'bg-gradient-to-r from-yellow-500/40 to-transparent' :
                    'bg-gradient-to-r from-orange/20 to-transparent'
                }`} />
                
                <div className={`relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 backdrop-blur-xl border rounded-[19px] shadow-sm transition-colors duration-500 ${
                    isCancelled ? 'bg-[#1a0f0f]/90 border-red-500/10' :
                    status === 'Active' ? 'bg-[#1a0f05]/90 border-orange/20' :
                    status === 'In Transit' ? 'bg-[#1a1505]/90 border-yellow-500/10' :
                    'bg-[#0a0a0a]/95 border-white/5'
                }`}>
                    
                    {/* ── Status Ribbon ────────────────────────────────────────── */}
                    <div className="absolute top-0 right-5 px-3 py-1 border-x border-b rounded-b-lg backdrop-blur-md z-20"
                         style={{ 
                             background: isCancelled ? 'rgba(239, 68, 68, 0.15)' : status === 'Active' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                             borderColor: isCancelled ? 'rgba(239, 68, 68, 0.1)' : status === 'Active' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                         }}>
                        <div className="flex items-center gap-1.5 relative z-10">
                            <span className={`h-1.5 w-1.5 rounded-full ${
                                isCancelled ? 'bg-red-500' :
                                status === 'In Transit' ? 'bg-yellow-400' :
                                status === 'Active' ? 'bg-orange animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-white/40'
                            }`} />
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                isCancelled ? 'text-red-400' :
                                status === 'In Transit' ? 'text-yellow-400' :
                                status === 'Active' ? 'text-orange-bright' : 'text-white/60'
                            }`}>
                                {isCancelled ? 'Cancelled' : status === 'In Transit' ? 'Starts Soon' : status === 'Active' ? 'Live Now' : 'Next Up'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 relative z-10 w-full pt-2 sm:pt-0">
                        {/* ── Icon Container ─────────────────────────────────── */}
                        <div className={`h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-[14px] flex items-center justify-center border transition-all duration-500 ${
                            isCancelled 
                                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                                : status === 'Active'
                                ? 'bg-orange/20 border-orange/40 text-orange shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                                : 'bg-white/5 border-white/10 text-orange/80'
                        }`}>
                            {isCancelled ? <Ban size={22} /> : status === 'Active' ? <Zap size={24} className="animate-pulse" /> : <Clock size={22} />}
                        </div>

                        {/* ── Text Content ───────────────────────────────────────── */}
                        <div className="flex-1 space-y-1">
                            <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-4 justify-between w-full">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-orange/80">
                                        The Warden
                                    </div>
                                    <h2 className={`text-xl sm:text-2xl font-[family-name:var(--font-outfit)] font-black tracking-tight ${
                                        isCancelled ? 'text-white/30 line-through' :
                                        status === 'Active' ? 'text-white drop-shadow-sm' : 'text-white/90'
                                    }`}>
                                        {nextClass.module_name}
                                    </h2>
                                </div>

                                {/* ── Live Countdown Timer ──────────────────────────── */}
                                {timeLeft && !isCancelled && (
                                    <div className={`shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded-lg border backdrop-blur-sm ${
                                        status === 'Active' ? 'bg-orange/10 border-orange/20' : 'bg-white/5 border-white/5'
                                    }`}>
                                        <Timer className={status === 'Active' ? 'text-orange' : 'text-white/40'} size={14} />
                                        <div className="flex flex-col">
                                            <span className={`text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 ${
                                                status === 'Active' ? 'text-orange/80' : 'text-white/40'
                                            }`}>
                                                {status === 'Active' ? 'Ends In' : 'Starts In'}
                                            </span>
                                            <span className={`text-sm font-black tracking-wider tabular-nums leading-none ${
                                                status === 'Active' ? 'text-orange-bright' : 'text-white'
                                            }`}>
                                                {timeLeft}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                {nextClass.course_code && (
                                    <span className={`px-2.5 py-1 rounded border text-[10px] font-bold tracking-wide ${
                                        status === 'Active' ? 'bg-orange/20 border-orange/30 text-orange-bright' : 'bg-white/5 border-white/10 text-white/70'
                                    }`}>
                                        {nextClass.course_code}
                                    </span>
                                )}
                                <div className="flex items-center gap-3 text-[12px] text-white/60 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={12} className={status === 'Active' ? 'text-orange' : 'text-white/40'} /> 
                                        {nextClass.start_time} - {nextClass.end_time}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={12} className={status === 'Active' ? 'text-orange' : 'text-white/40'} /> {nextClass.venue || "TBA"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Actions ───────────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 relative z-10 shrink-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 mt-2 sm:mt-0">
                        {isRep && !isCancelled && status !== 'Free' && (
                            <button 
                                onClick={handleCancel}
                                className="w-full sm:w-auto h-10 px-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] font-bold tracking-wide hover:bg-red-500/10 transition-colors"
                            >
                                <span className="flex items-center justify-center gap-1.5">
                                    <Ban size={12} />
                                    Cancel
                                </span>
                            </button>
                        )}
                        <button className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-all ${
                            status === 'Active' ? 'bg-orange hover:bg-orange-bright text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/5 hover:bg-orange/10 text-white/40 hover:text-orange'
                        }`}>
                            <ChevronRight size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                </div>
            </div>
        </section>
    )
}
