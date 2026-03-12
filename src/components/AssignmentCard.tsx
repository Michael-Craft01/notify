'use client'

import { useState } from 'react'
import { Clock, CheckCircle2, ShieldCheck, Play, Zap, Award, ChevronRight, MessageSquare } from 'lucide-react'
import { verifyAssignment, updateProgress } from '@/app/actions/assignments'

type AssignmentProps = {
    assignment: {
        id: string
        course_code: string
        title: string
        description: string | null
        due_date: string
        status: 'pending' | 'verified'
        users: { full_name: string }
        assignment_pulse_stats: [{
            finished_percentage: number
            involvement_percentage: number
        }] | null
        user_progress: [{
            status: 'not_started' | 'in_progress' | 'finished'
        }] | null
    }
    currentUserId: string
}

export default function AssignmentCard({ assignment, currentUserId }: AssignmentProps) {
    const [isVerifying, setIsVerifying] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    const isPending = assignment.status === 'pending'
    const dueDate = new Date(assignment.due_date)

    const pulse = assignment.assignment_pulse_stats?.[0] || { finished_percentage: 0, involvement_percentage: 0 }
    const userStatus = assignment.user_progress?.[0]?.status || 'not_started'

    const dateString = dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
    const timeString = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const hoursLeft = (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    const isUrgent = hoursLeft < 48 && hoursLeft > 0
    const isOverdue = hoursLeft <= 0

    const handleVerify = async () => {
        setIsVerifying(true)
        const result = await verifyAssignment(assignment.id)
        setIsVerifying(false)
        if (result?.error) alert(result.error)
    }

    const handleStatusUpdate = async (newStatus: 'in_progress' | 'finished') => {
        setIsUpdating(true)
        const result = await updateProgress(assignment.id, newStatus)
        setIsUpdating(false)
        if (result?.error) alert(result.error)
    }

    return (
        <div className={`premium-card group relative flex flex-col md:flex-row md:items-center rounded-2xl px-8 py-5 gap-8 transition-all animate-fade-in border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:shadow-premium ${userStatus === 'finished' ? 'opacity-60 grayscale-[0.5]' : ''
            }`}>
            {/* Left: Metadata & Identity */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 md:flex-1">
                <div className="flex items-center gap-4 shrink-0">
                    <div className={`h-9 w-20 rounded-lg flex items-center justify-center text-[11px] font-black tracking-[0.1em] border shadow-sm ${isUrgent ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)]/30 text-[var(--color-primary)]' : 'bg-white/5 border-white/10 text-neutral-500'
                        }`}>
                        {assignment.course_code}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                        <h3 className={`text-[17px] font-bold text-white font-outfit tracking-tight truncate ${isOverdue && userStatus !== 'finished' ? 'text-red-500/50' : ''} ${userStatus === 'finished' ? 'line-through text-neutral-500' : ''}`}>
                            {assignment.title}
                        </h3>
                        {isUrgent && userStatus !== 'finished' && <div className="h-2 w-2 rounded-full bg-[var(--color-primary)] shadow-glow animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-4 text-[13px] font-semibold text-neutral-500 uppercase tracking-wide">
                        <span className="flex items-center gap-2 shrink-0">
                            <Clock size={14} strokeWidth={2.5} className="text-neutral-600" />
                            {dateString} <span className="text-neutral-700 mx-1">/</span> {timeString}
                        </span>
                        {assignment.description && (
                            <span className="flex items-center gap-2 truncate text-neutral-600">
                                <span className="h-1 w-1 rounded-full bg-neutral-800" />
                                <span className="truncate normal-case font-medium">{assignment.description}</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Actions & Progress */}
            <div className="flex items-center justify-between md:justify-end gap-10 pt-6 md:pt-0 shrink-0 border-t md:border-t-0 border-white/5">
                {/* Network Progress Indicator */}
                {userStatus !== 'finished' && !isOverdue && (
                    <div className="hidden lg:flex flex-col gap-2 text-right min-w-[120px]">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Cohort Progress</span>
                        <div className="flex items-center gap-3 justify-end">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`h-1.5 w-4 rounded-full transition-colors ${i * 20 <= pulse.finished_percentage ? 'bg-[var(--color-primary)]' : 'bg-neutral-800'}`} />
                                ))}
                            </div>
                            <span className="text-[12px] font-black text-neutral-400 font-outfit">{pulse.finished_percentage}%</span>
                        </div>
                    </div>
                )}

                {/* Primary Action Button */}
                <div className="flex items-center gap-4">
                    {userStatus === 'finished' ? (
                        <div className="h-11 px-6 rounded-xl bg-green-500/10 text-green-500 text-[13px] font-extrabold flex items-center gap-2.5 border border-green-500/20 shadow-sm uppercase tracking-[0.1em]">
                            <CheckCircle2 size={16} strokeWidth={2.5} /> Completed
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {userStatus === 'not_started' ? (
                                <button
                                    onClick={() => handleStatusUpdate('in_progress')}
                                    disabled={isUpdating}
                                    className="h-11 px-6 rounded-xl bg-neutral-900 border border-white/10 text-neutral-400 text-[13px] font-extrabold flex items-center gap-2.5 transition-all hover:bg-white hover:text-black active:scale-95 disabled:opacity-50 uppercase tracking-[0.1em]"
                                >
                                    <Play size={14} fill="currentColor" /> Begin Task
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleStatusUpdate('finished')}
                                    disabled={isUpdating}
                                    className="h-11 px-6 rounded-xl bg-[var(--color-primary)] text-white text-[13px] font-extrabold flex items-center gap-2.5 transition-all hover:brightness-110 active:scale-95 shadow-glow disabled:opacity-50 uppercase tracking-[0.1em]"
                                >
                                    <Zap size={16} fill="currentColor" /> Complete
                                </button>
                            )}
                        </div>
                    )}

                    <button className="h-11 w-11 flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-500 hover:text-white hover:bg-white/10 transition-all shadow-sm">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}



function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
