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
            className="card"
            style={{
                borderRadius: 14,
                padding: '18px 20px',
                opacity: isDone ? 0.55 : 1,
                transition: 'opacity 0.3s',
            }}
        >
            {/* ── Top row ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

                {/* Type icon */}
                <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginTop: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                }}>
                    <TypeIcon size={15} color="var(--color-text-muted)" />
                </div>

                {/* Title + course */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                            color: 'var(--color-text-dim)',
                        }}>
                            {assignment.course_code}
                        </span>
                        {/* Urgency indicator */}
                        {!isDone && (
                            <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                                paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2,
                                borderRadius: 99,
                                background: isOverdue
                                    ? 'rgba(249,115,22,0.12)'
                                    : hoursLeft < 6
                                    ? 'rgba(249,115,22,0.08)'
                                    : 'transparent',
                                color: isOverdue || hoursLeft < 6
                                    ? '#FB923C'
                                    : 'var(--color-text-dim)',
                                border: isOverdue || hoursLeft < 6
                                    ? '1px solid rgba(249,115,22,0.25)'
                                    : '1px solid transparent',
                            }}>
                                {timeLabel}
                            </span>
                        )}
                        {isDone && (
                            <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                                color: 'var(--color-text-dim)',
                            }}>Completed</span>
                        )}
                    </div>

                    <p style={{
                        fontFamily: 'var(--font-outfit)',
                        fontSize: 15, fontWeight: 700,
                        color: isDone ? 'var(--color-text-dim)' : 'var(--color-text-main)',
                        letterSpacing: '-0.01em',
                        textDecoration: isDone ? 'line-through' : 'none',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {assignment.title}
                    </p>

                    <p style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 3 }}>
                        {due.toLocaleDateString([], { month: 'short', day: 'numeric' })} · {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {assignment.users?.full_name && <> · Posted by {assignment.users.full_name}</>}
                    </p>
                </div>

                {/* Right: actions + expand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* Quick link */}
                    {assignment.resource_url && (
                        <a
                            href={assignment.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                height: 32, width: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'border-color 0.15s',
                            }}
                            title="Open resource"
                            aria-label="Open resource link"
                        >
                            <ExternalLink size={13} />
                        </a>
                    )}

                    {/* Status button */}
                    {!isDone && (
                        <button
                            onClick={() => handleStatus(status === 'not_started' ? 'in_progress' : 'finished')}
                            disabled={isPending}
                            className="btn-primary"
                            style={{ height: 32, paddingLeft: 14, paddingRight: 14, borderRadius: 8, fontSize: 11, whiteSpace: 'nowrap' }}
                        >
                            {isPending ? <Loader2 size={11} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} /> :
                             status === 'not_started' ? 'Begin' : 'Mark Done'}
                        </button>
                    )}

                    {isDone && (
                        <div style={{ height: 32, width: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                            <CheckCircle2 size={14} color="var(--color-text-muted)" />
                        </div>
                    )}

                    {/* Expand toggle */}
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="btn-ghost"
                        style={{ height: 32, width: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        aria-label={expanded ? "Collapse details" : "Expand details"}
                        aria-expanded={expanded}
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* ── Cohort progress bar ─────────────────────────────────────── */}
            {pctDone > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-dim)', letterSpacing: '0.08em' }}>
                            Cohort progress
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)' }}>
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
                <div style={{
                    marginTop: 14, paddingTop: 14,
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex', flexDirection: 'column', gap: 10,
                }} className="animate-fade-up">
                    {assignment.description && (
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            {assignment.description}
                        </p>
                    )}
                    {assignment.resource_url && (
                        <a
                            href={assignment.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)', textDecoration: 'none' }}
                        >
                            <Link2 size={11} /> {assignment.resource_url}
                        </a>
                    )}
                    {assignment.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
                            <MapPin size={11} /> {assignment.location}
                        </div>
                    )}
                    {!isDone && status === 'in_progress' && (
                        <button
                            onClick={() => handleStatus('finished')}
                            disabled={isPending}
                            className="btn-secondary"
                            style={{ alignSelf: 'flex-start', height: 30, paddingLeft: 12, paddingRight: 12, borderRadius: 8, fontSize: 11 }}
                        >
                            {isPending ? 'Saving…' : '✓ Mark as Completed'}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
