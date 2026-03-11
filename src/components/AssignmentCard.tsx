'use client'

import { useState } from 'react'
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { verifyAssignment } from '@/app/actions/assignments'

type AssignmentProps = {
    assignment: {
        id: string
        course_code: string
        title: string
        description: string | null
        due_date: string
        status: 'pending' | 'verified'
        users: { full_name: string } // The creator
    }
    currentUserId: string
}

export default function AssignmentCard({ assignment, currentUserId }: AssignmentProps) {
    const [isVerifying, setIsVerifying] = useState(false)

    const isPending = assignment.status === 'pending'
    const dueDate = new Date(assignment.due_date)

    // Basic time formatting
    const timeString = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const dateString = dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' })

    // Calculate urgency (simplified for now)
    const hoursLeft = (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    const isUrgent = hoursLeft < 48 && hoursLeft > 0
    const isOverdue = hoursLeft <= 0

    const handleVerify = async () => {
        setIsVerifying(true)
        const result = await verifyAssignment(assignment.id)
        setIsVerifying(false)
        if (result?.error) {
            alert(result.error)
        }
    }

    return (
        <div className={`flex flex-col gap-3 rounded-2xl border bg-[var(--color-surface)] p-5 shadow-sm transition-all duration-300 ${isPending ? 'border-dashed border-[var(--color-text-muted)] opacity-80' :
                isUrgent ? 'border-[var(--color-primary)] shadow-[0_0_15px_rgba(234,88,12,0.15)]' :
                    'border-[var(--color-surface-hover)]'
            }`}>

            {/* Header Row: Status & Course Tag */}
            <div className="flex items-center justify-between">
                {isPending ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-400">
                        <AlertTriangle size={12} />
                        Pending Verification
                    </span>
                ) : isUrgent ? (
                    <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500 animate-pulse">
                        <Clock size={12} />
                        Immediate Threat
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                        <ShieldCheck size={12} />
                        Verified
                    </span>
                )}
                <span className="text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase">
                    {assignment.course_code}
                </span>
            </div>

            {/* Main Content */}
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

            {/* Footer Actions */}
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
                ) : (
                    /* Placeholder for Phase 3: The Pulse (Start/Finish tracking) */
                    <button className="flex items-center gap-1.5 rounded-lg border border-[var(--color-surface-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-white">
                        Not Started
                    </button>
                )}
            </div>

        </div>
    )
}
