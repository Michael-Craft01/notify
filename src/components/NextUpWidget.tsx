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
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange/20 to-orange/5 rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                
                <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 p-6 sm:p-8 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden">
                    {/* Status Badge */}
                    <div className="absolute top-0 right-0 px-6 py-2 bg-white/5 border-b border-l border-white/10 rounded-bl-2xl">
                        <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor] ${
                                isCancelled ? 'text-red-500 bg-red-500' :
                                status === 'In Transit' ? 'text-orange bg-orange' :
                                status === 'Active' ? 'text-green-500 bg-green-500' : 'text-white/20 bg-white/20'
                            }`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                {isCancelled ? 'Cancelled' : status === 'In Transit' ? 'In Transit' : status === 'Active' ? 'Live Now' : 'Upcoming'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border transition-all ${
                            isCancelled ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            status === 'Active' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                            'bg-orange/10 border-orange/20 text-orange shadow-[0_0_30px_rgba(249,115,22,0.1)]'
                        }`}>
                            {isCancelled ? <Ban size={30} /> : <Clock size={30} />}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={12} className="text-orange" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">The Warden suggests</span>
                            </div>
                            <h2 className={`text-2xl sm:text-3xl font-[family-name:var(--font-outfit)] font-black tracking-tight ${isCancelled ? 'text-white/20 line-through' : 'text-white'}`}>
                                {nextClass.module_name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                {nextClass.course_code && (
                                    <span className="text-xs font-bold text-orange/80">{nextClass.course_code}</span>
                                )}
                                <span className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
                                    <Clock size={14} /> {nextClass.start_time} - {nextClass.end_time}
                                </span>
                                {nextClass.venue && (
                                    <span className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
                                        <MapPin size={14} /> {nextClass.venue}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isRep && !isCancelled && status !== 'Free' && (
                            <button 
                                onClick={handleCancel}
                                className="h-11 px-6 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all active:scale-95"
                            >
                                Cancel Today
                            </button>
                        )}
                        <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-white group-hover:bg-orange transition-all cursor-pointer">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
