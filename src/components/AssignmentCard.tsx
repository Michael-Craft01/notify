'use client'

import { useState } from 'react'
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck, Play } from 'lucide-react'
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

    // Basic time formatting
    const timeString = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const dateString = dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })

    // Calculate urgency
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
        <div className={`flex flex-col gap-3 rounded-2xl border bg-[var(--color-surface)] p-5 shadow-sm transition-all duration-300 ${isPending ? 'border-dashed border-[var(--color-text-muted)] opacity-80' :
            isUrgent ? 'border-[var(--color-primary)] shadow-[0_0_15px_rgba(234,88,12,0.15)]' :
                'border-[var(--color-surface-hover)]'
            }`}>

            <div className="flex items-center justify-between">
                {isPending ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-400">
                        <AlertTriangle size={12} /> Pending Verification
                    </span>
                ) : isUrgent ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500 animate-pulse">
                        <Clock size={12} /> Immediate Threat
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                        <ShieldCheck size={12} /> Verified
                    </span>
                )}
                <span className="text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase">
                    {assignment.course_code}
                </span>
            </div>

            <div className={isOverdue ? 'opacity-50 line-through' : ''}>
                <h3 className="text-xl font-bold text-[var(--color-text-main)] leading-tight">{assignment.title}</h3>
                {assignment.description && (
                    <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-2">{assignment.description}</p>
                )}

                <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${isUrgent ? 'text-[var(--color-primary-light)]' : 'text-[var(--color-text-muted)]'}`}>
                    <Clock size={16} />
                    <span>Due: {dateString}, {timeString}</span>
                </div>
            </div>

            {/* The Pulse Progress Bar (Only for Verified) */}
            {!isPending && !isOverdue && (
                <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] mb-1 uppercase tracking-tighter font-bold">
                        <span className="text-[var(--color-text-muted)]">Class Pulse</span>
                        <span className="text-[var(--color-primary)]">{pulse.finished_percentage}% Finished</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                        <div
                            className="h-full bg-[var(--color-primary)] transition-all duration-500"
                            style={{ width: `${pulse.finished_percentage}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="mt-2 pt-3 border-t border-[var(--color-surface-hover)] flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-muted)]">
                    Proposed by {assignment.users?.full_name?.split(' ')[0] || 'Unknown'}
                </span>

                {isPending ? (
                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-hover)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                    >
                        <CheckCircle2 size={14} />
                        {isVerifying ? 'Verifying...' : 'Confirm Deadline'}
                    </button>
                ) : userStatus === 'finished' ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500">
                        <CheckCircle2 size={14} /> Mission Complete
                    </span>
                ) : (
                    <div className="flex gap-2">
                        {userStatus === 'not_started' ? (
                            <button
                                onClick={() => handleStatusUpdate('in_progress')}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-hover)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary)] disabled:opacity-50"
                            >
                                <Play size={12} fill="currentColor" /> Start Task
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStatusUpdate('finished')}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                            >
                                <CheckCircle2 size={14} /> Mark Finished
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
