'use client'

import { useState, useTransition } from 'react'
import {
    Clock, CheckCircle2, ChevronDown, ChevronUp,
    Loader2, Link2, MapPin, FileText, ClipboardList,
    Monitor, ExternalLink, Play
} from 'lucide-react'
import { updateProgress } from '@/app/actions/assignments'

type ProgressStatus = 'not_started' | 'in_progress' | 'finished'
type TaskType = 'assignment' | 'quiz' | 'online_test' | 'physical_test'

type AssignmentProps = {
    assignment: {
        id: string
        course_code: string
        title: string
        description: string | null
        due_date: string
        task_type?: TaskType
        resource_url?: string | null
        location?: string | null
        users: { full_name: string }
    }
    pulse: { finished_percentage: number; involvement_percentage: number }
    userStatus: ProgressStatus
    currentUserId: string
}

const TYPE_ICONS: Record<TaskType, React.ElementType> = {
    assignment:    FileText,
    quiz:          ClipboardList,
    online_test:   Monitor,
    physical_test: MapPin,
}

export default function AssignmentCard({ assignment, pulse, userStatus: init }: AssignmentProps) {
    const [status, setStatus] = useState<ProgressStatus>(init)
    const [expanded, setExpanded] = useState(false)
    const [isPending, startTransition] = useTransition()

    const due      = new Date(assignment.due_date)
    const hoursLeft = (due.getTime() - Date.now()) / 3600000
    const isOverdue = hoursLeft <= 0
    const isDone    = status === 'finished'

    const TypeIcon = TYPE_ICONS[assignment.task_type || 'assignment']

    const timeLabel = (() => {
        if (isOverdue) return `${Math.abs(Math.ceil(hoursLeft / 24))}d overdue`
        if (hoursLeft < 1) return `${Math.floor(hoursLeft * 60)}m left`
        if (hoursLeft < 24) return `${Math.floor(hoursLeft)}h left`
        return `${Math.ceil(hoursLeft / 24)}d left`
    })()

    const handleStatus = (next: ProgressStatus) => {
        startTransition(async () => {
            const prev = status
            setStatus(next)
            const res = await updateProgress(assignment.id, next as any)
            if (res?.error) setStatus(prev)
        })
    }

    const pctDone = Math.round(pulse.finished_percentage)

    return (
        <div
            className={`card p-4 sm:p-5 rounded-[14px] transition-all duration-300 ${isDone ? 'opacity-55 hover:opacity-75' : ''}`}
        >
            {/* ── Top row ─────────────────────────────────────────────────── */}
            <div className="flex items-start gap-3.5">

                {/* Type icon */}
                <div className="w-9 h-9 rounded-lg shrink-0 mt-0.5 flex items-center justify-center bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-sm">
                    <TypeIcon size={16} className="text-[var(--color-text-muted)]" />
                </div>

                {/* Title + course */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-extrabold tracking-[0.14em] uppercase text-[var(--color-text-dim)]">
                            {assignment.course_code}
                        </span>
                        {/* Urgency indicator */}
                        {!isDone && (
                            <span className={`text-[9px] font-bold tracking-[0.08em] px-1.5 py-0.5 rounded-full border ${isOverdue ? 'bg-[#F97316]/10 text-[#FB923C] border-[#F97316]/25' : hoursLeft < 6 ? 'bg-[#F97316]/5 text-[#FB923C] border-[#F97316]/20' : 'bg-transparent text-[var(--color-text-dim)] border-transparent'}`}>
                                {timeLabel}
                            </span>
                        )}
                        {isDone && (
                            <span className="text-[9px] font-bold tracking-[0.08em] text-[var(--color-text-dim)]">Completed</span>
                        )}
                    </div>

                    <p className={`font-[family-name:var(--font-outfit)] text-[15px] font-bold tracking-[-0.01em] whitespace-nowrap overflow-hidden text-overflow-ellipsis ${isDone ? 'text-[var(--color-text-dim)] line-through' : 'text-[var(--color-text-main)]'}`}>
                        {assignment.title}
                    </p>

                    <p className="text-[11px] text-[var(--color-text-dim)] mt-0.5">
                        {due.toLocaleDateString([], { month: 'short', day: 'numeric' })} · {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {assignment.users?.full_name && <> · Posted by {assignment.users.full_name}</>}
                    </p>
                </div>

                {/* Right: actions + expand */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Quick link */}
                    {assignment.resource_url && (
                        <a
                            href={assignment.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg flex items-center justify-center bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-main)] hover:border-[var(--color-border-hover)] transition-all shrink-0"
                            title="Open resource"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}

                    {/* Status button */}
                    {!isDone && (
                        <button
                            onClick={() => handleStatus(status === 'not_started' ? 'in_progress' : 'finished')}
                            disabled={isPending}
                            className="btn-primary h-8 px-3.5 rounded-lg text-[11px] whitespace-nowrap shrink-0"
                        >
                            {isPending ? <Loader2 size={12} className="inline animate-spin" /> :
                             status === 'not_started' ? 'Begin' : 'Mark Done'}
                        </button>
                    )}

                    {isDone && (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[var(--color-surface-2)] border border-[var(--color-border)] shrink-0">
                            <CheckCircle2 size={15} className="text-[var(--color-text-muted)]" />
                        </div>
                    )}

                    {/* Expand toggle */}
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="btn-ghost h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-colors shrink-0"
                    >
                        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                </div>
            </div>

            {/* ── Cohort progress bar ─────────────────────────────────────── */}
            {pctDone > 0 && (
                <div className="mt-3.5 pt-3.5 border-t border-[var(--color-border)]">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-semibold tracking-[0.08em] text-[var(--color-text-dim)]">
                            Cohort progress
                        </span>
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                            {pctDone}%
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pctDone}%` }} />
                    </div>
                </div>
            )}

            {/* ── Expanded detail ─────────────────────────────────────────── */}
            {expanded && (
                <div className="mt-3.5 pt-3.5 border-t border-[var(--color-border)] flex flex-col gap-2.5 animate-fade-up">
                    {assignment.description && (
                        <p className="text-xs text-[var(--color-text-muted)] leading-[1.6]">
                            {assignment.description}
                        </p>
                    )}
                    {assignment.resource_url && (
                        <a
                            href={assignment.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-[#FB923C] transition-colors w-fit truncate"
                        >
                            <Link2 size={12} className="shrink-0" /> <span className="underline decoration-[#FB923C]/30 underline-offset-2 truncate leading-tight">{assignment.resource_url}</span>
                        </a>
                    )}
                    {assignment.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                            <MapPin size={12} className="shrink-0" /> {assignment.location}
                        </div>
                    )}
                    {!isDone && status === 'in_progress' && (
                        <button
                            onClick={() => handleStatus('finished')}
                            disabled={isPending}
                            className="btn-secondary self-start h-[30px] px-3 rounded-lg text-[11px]"
                        >
                            {isPending ? 'Saving…' : '✓ Mark as Completed'}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
