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
        <div className={`premium-card group relative flex flex-col md:flex-row md:items-center rounded-xl px-6 py-4 gap-6 transition-all animate-fade-in ${isPending ? 'opacity-60 bg-neutral-900/40' : ''
            }`}>
            {/* Left: Metadata & Identity */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:flex-1">
                <div className="flex items-center gap-3 shrink-0">
                    <div className={`h-8 w-16 rounded-md flex items-center justify-center text-[11px] font-bold tracking-tight border ${isUrgent ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-white/5 border-white/10 text-neutral-400'
                        }`}>
                        {assignment.course_code}
                    </div>
                    {isPending && (
                        <div className="h-5 w-5 rounded-full bg-neutral-800 flex items-center justify-center animate-pulse">
                            <Clock size={10} className="text-neutral-500" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`text-[15px] font-bold text-neutral-100 truncate ${isOverdue ? 'opacity-40 line-through' : ''}`}>
                            {assignment.title}
                        </h3>
                        {isUrgent && <Zap size={12} className="text-[var(--color-primary)] fill-current" />}
                    </div>
                    <div className="flex items-center gap-3 text-[12px] font-medium text-neutral-500">
                        <span className="flex items-center gap-1.5 shrink-0">
                            <Clock size={13} strokeWidth={2.5} />
                            {dateString}, {timeString}
                        </span>
                        {assignment.description && (
                            <span className="flex items-center gap-1.5 truncate">
                                <span className="h-1 w-1 rounded-full bg-neutral-700" />
                                <span className="truncate">{assignment.description}</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Collective Progress & Actions */}
            <div className="flex items-center justify-between md:justify-end gap-8 pt-4 md:pt-0 shrink-0">
                {/* Cohort Progress Indicator */}
                {!isPending && !isOverdue && (
                    <div className="hidden lg:flex flex-col gap-1.5 text-right min-w-[100px]">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Network</span>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`h-1 w-3 rounded-sm ${i * 20 <= pulse.finished_percentage ? 'bg-[var(--color-primary)]' : 'bg-neutral-800'}`} />
                                ))}
                            </div>
                            <span className="text-[11px] font-bold text-neutral-400">{pulse.finished_percentage}%</span>
                        </div>
                    </div>
                )}

                {/* Primary Action Button */}
                <div className="flex items-center gap-3">
                    {isPending ? (
                        <button
                            onClick={handleVerify}
                            disabled={isVerifying}
                            className="h-10 px-4 rounded-lg bg-white text-black text-[13px] font-bold flex items-center gap-2 transition-all hover:bg-neutral-200 active:scale-95 disabled:opacity-50"
                        >
                            {isVerifying ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} strokeWidth={2.5} />}
                            Verify Intel
                        </button>
                    ) : userStatus === 'finished' ? (
                        <div className="h-10 px-4 rounded-lg bg-green-500/10 text-green-500 text-[13px] font-bold flex items-center gap-2 border border-green-500/20">
                            <CheckCircle2 size={14} strokeWidth={2.5} /> Done
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {userStatus === 'not_started' ? (
                                <button
                                    onClick={() => handleStatusUpdate('in_progress')}
                                    disabled={isUpdating}
                                    className="h-10 px-4 rounded-lg bg-neutral-900 border border-white/5 text-white/60 text-[13px] font-bold flex items-center gap-2 transition-all hover:bg-white hover:text-black active:scale-95 disabled:opacity-50"
                                >
                                    <Play size={12} fill="currentColor" /> Start Work
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleStatusUpdate('finished')}
                                    disabled={isUpdating}
                                    className="h-10 px-4 rounded-lg bg-[var(--color-primary)] text-white text-[13px] font-bold flex items-center gap-2 transition-all hover:brightness-110 active:scale-95 shadow-[0_4px_12px_rgba(249,115,22,0.15)] disabled:opacity-50"
                                >
                                    <Zap size={14} fill="currentColor" /> Finish
                                </button>
                            )}
                        </div>
                    )}

                    {!isPending && (
                        <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-neutral-600 hover:text-white hover:bg-white/5 transition-all">
                            <ChevronRight size={18} />
                        </button>
                    )}
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
