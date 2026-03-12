'use client'

import { useState, useTransition } from 'react'
import {
    Clock, CheckCircle2, Play, Zap, ChevronDown, ChevronUp,
    AlertTriangle, Loader2, Users, Link2, MapPin,
    FileText, ClipboardList, Monitor, ExternalLink
} from 'lucide-react'
import { updateProgress } from '@/app/actions/assignments'

type ProgressStatus = 'not_started' | 'in_progress' | 'finished'
type TaskType = 'assignment' | 'quiz' | 'online_test' | 'physical_test'

type PulseData = {
    finished_percentage: number
    involvement_percentage: number
    total_cohort?: number
}

type AssignmentProps = {
    assignment: {
        id: string
        course_code: string
        title: string
        description: string | null
        due_date: string
        status: 'pending' | 'verified'
        task_type?: TaskType
        resource_url?: string | null
        location?: string | null
        users: { full_name: string }
    }
    pulse: PulseData
    userStatus: ProgressStatus
    currentUserId: string
}

const STATUS_CONFIG = {
    not_started: { label: 'Not Started', color: 'var(--color-text-dim)', bg: 'var(--color-surface-2)', border: 'var(--color-border)' },
    in_progress:  { label: 'In Progress', color: 'var(--color-warning)', bg: 'var(--color-warning-soft)', border: 'hsla(38,95%,58%,0.25)' },
    finished:     { label: 'Completed',   color: 'var(--color-success)', bg: 'var(--color-success-soft)', border: 'hsla(142,70%,45%,0.25)' },
}

const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    assignment:    { label: 'Assignment',   icon: FileText,      color: 'var(--color-primary)',  bg: 'var(--color-primary-soft)' },
    quiz:          { label: 'Quiz',         icon: ClipboardList, color: 'var(--color-warning)',  bg: 'var(--color-warning-soft)' },
    online_test:   { label: 'Online Test',  icon: Monitor,       color: 'var(--color-info)',     bg: 'var(--color-info-soft)' },
    physical_test: { label: 'Physical Test',icon: MapPin,        color: 'var(--color-success)',  bg: 'var(--color-success-soft)' },
}

export default function AssignmentCard({ assignment, pulse, userStatus: initialStatus, currentUserId }: AssignmentProps) {
    const [userStatus, setUserStatus] = useState<ProgressStatus>(initialStatus)
    const [expanded, setExpanded] = useState(false)
    const [isPending, startTransition] = useTransition()

    const dueDate = new Date(assignment.due_date)
    const hoursLeft = (dueDate.getTime() - Date.now()) / 3600000
    const isOverdue = hoursLeft <= 0
    const isUrgent = hoursLeft > 0 && hoursLeft < 48
    const isFinished = userStatus === 'finished'

    const taskType = assignment.task_type || 'assignment'
    const typeConf = TASK_TYPE_CONFIG[taskType]
    const statusConf = STATUS_CONFIG[userStatus]

    const handleStatusUpdate = (newStatus: ProgressStatus) => {
        startTransition(async () => {
            const prev = userStatus
            setUserStatus(newStatus)
            const result = await updateProgress(assignment.id, newStatus as 'in_progress' | 'finished')
            if (result?.error) {
                setUserStatus(prev)
                alert(result.error)
            }
        })
    }

    const timeLabel = (() => {
        if (isOverdue) return `${Math.abs(Math.ceil(hoursLeft / 24))}d overdue`
        if (hoursLeft < 1) return `${Math.floor(hoursLeft * 60)}m left`
        if (hoursLeft < 24) return `${Math.floor(hoursLeft)}h left`
        return `${Math.ceil(hoursLeft / 24)}d left`
    })()

    const hasExpandable = assignment.description || assignment.resource_url || assignment.location

    // Border style based on urgency
    const cardBorderColor = isFinished
        ? 'hsla(142,70%,45%,0.15)'
        : isOverdue
        ? 'hsla(4,86%,58%,0.3)'
        : isUrgent
        ? 'hsla(38,95%,58%,0.3)'
        : 'var(--color-border)'

    return (
        <div
            className="rounded-2xl overflow-hidden transition-all"
            style={{
                background: 'var(--color-surface)',
                border: `1px solid ${cardBorderColor}`,
                opacity: isFinished ? 0.6 : 1,
            }}
        >
            {/* Urgency stripe at top */}
            {(isOverdue || isUrgent) && !isFinished && (
                <div
                    className="h-0.5"
                    style={{
                        background: isOverdue
                            ? 'linear-gradient(90deg, var(--color-danger) 0%, transparent 80%)'
                            : 'linear-gradient(90deg, var(--color-warning) 0%, transparent 80%)',
                    }}
                />
            )}

            <div className="px-5 py-4">
                {/* ── Row 1: Type badge | Course | Title | Urgency badge | Expand ── */}
                <div className="flex items-start gap-3">
                    {/* Type icon pill */}
                    <div
                        className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ background: typeConf.bg }}
                        title={typeConf.label}
                    >
                        <typeConf.icon size={15} style={{ color: typeConf.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                                className="course-tag text-[10px] px-2 py-0.5 rounded-md border shrink-0"
                                style={{
                                    background: 'var(--color-surface-2)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-text-muted)',
                                }}
                            >
                                {assignment.course_code}
                            </span>
                            <h3
                                className="text-[15px] font-bold truncate flex-1"
                                style={{
                                    color: isFinished ? 'var(--color-text-dim)'
                                        : isOverdue ? 'var(--color-danger)'
                                        : 'var(--color-text-main)',
                                    textDecoration: isFinished ? 'line-through' : 'none',
                                    fontFamily: 'var(--font-outfit), sans-serif',
                                }}
                            >
                                {assignment.title}
                            </h3>
                            {isOverdue && !isFinished && (
                                <span className="badge shrink-0" style={{ background: 'var(--color-danger-soft)', color: 'var(--color-danger)', border: '1px solid hsla(4,86%,58%,0.25)', fontSize: '10px' }}>
                                    <AlertTriangle size={9} /> Overdue
                                </span>
                            )}
                            {isUrgent && !isOverdue && !isFinished && (
                                <span className="badge shrink-0" style={{ background: 'var(--color-warning-soft)', color: 'var(--color-warning)', border: '1px solid hsla(38,95%,58%,0.2)', fontSize: '10px' }}>
                                    Urgent
                                </span>
                            )}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span
                                className="flex items-center gap-1.5 text-[12px] font-medium"
                                style={{ color: isOverdue && !isFinished ? 'var(--color-danger)' : isUrgent && !isFinished ? 'var(--color-warning)' : 'var(--color-text-muted)' }}
                            >
                                <Clock size={11} />
                                {dueDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} · {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <span
                                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-1"
                                    style={{
                                        background: isOverdue && !isFinished ? 'var(--color-danger-soft)' : isUrgent && !isFinished ? 'var(--color-warning-soft)' : 'var(--color-surface-2)',
                                        color: isOverdue && !isFinished ? 'var(--color-danger)' : isUrgent && !isFinished ? 'var(--color-warning)' : 'var(--color-text-dim)',
                                    }}
                                >
                                    {timeLabel}
                                </span>
                            </span>

                            {/* Type label */}
                            <span
                                className="badge shrink-0"
                                style={{
                                    background: typeConf.bg,
                                    color: typeConf.color,
                                    border: `1px solid ${typeConf.color}33`,
                                    fontSize: '10px',
                                    padding: '2px 8px',
                                }}
                            >
                                {typeConf.label}
                            </span>

                            {/* Creator */}
                            {assignment.users?.full_name && (
                                <span className="text-[11px] hidden sm:block" style={{ color: 'var(--color-text-dim)' }}>
                                    by {assignment.users.full_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Expand toggle */}
                    {hasExpandable && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="btn-ghost shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mt-0.5"
                        >
                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                    )}
                </div>

                {/* ── Expanded Details ── */}
                {expanded && (
                    <div
                        className="mt-4 pt-4 border-t space-y-3 animate-fade-in"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        {/* Description */}
                        {assignment.description && (
                            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                {assignment.description}
                            </p>
                        )}

                        {/* Resource URL */}
                        {assignment.resource_url && (
                            <a
                                href={assignment.resource_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[13px] font-semibold transition-colors"
                                style={{ color: typeConf.color }}
                            >
                                <Link2 size={13} />
                                <span className="truncate">{assignment.resource_url}</span>
                                <ExternalLink size={11} className="shrink-0" />
                            </a>
                        )}

                        {/* Location */}
                        {assignment.location && (
                            <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: 'var(--color-success)' }}>
                                <MapPin size={13} />
                                {assignment.location}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Row 2: Pulse + Actions ── */}
                <div
                    className="flex items-end justify-between gap-4 mt-4 pt-4 border-t flex-wrap"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    {/* Cohort Pulse */}
                    <div className="space-y-1.5 flex-1 min-w-[140px]">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-dim)' }}>
                                <Users size={10} />
                                Cohort
                            </span>
                            <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                                <span style={{ color: 'var(--color-success)' }}>{pulse.finished_percentage}%</span> done ·{' '}
                                <span style={{ color: 'var(--color-warning)' }}>{pulse.involvement_percentage}%</span> active
                            </span>
                        </div>
                        <div className="progress-bar" style={{ height: '5px', position: 'relative' }}>
                            {/* active layer (behind) */}
                            <div
                                style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: `${pulse.involvement_percentage}%`,
                                    height: '100%',
                                    background: 'var(--color-warning)',
                                    opacity: 0.35,
                                    borderRadius: '99px',
                                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                                }}
                            />
                            {/* finished layer (on top) */}
                            <div
                                style={{
                                    position: 'absolute', top: 0, left: 0,
                                    width: `${pulse.finished_percentage}%`,
                                    height: '100%',
                                    background: 'var(--color-success)',
                                    borderRadius: '99px',
                                    boxShadow: '0 0 6px -2px var(--color-success)',
                                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                                }}
                            />
                        </div>
                    </div>

                    {/* Status + CTA */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Status badge */}
                        <div
                            className="badge"
                            style={{
                                background: statusConf.bg,
                                color: statusConf.color,
                                border: `1px solid ${statusConf.border}`,
                                fontSize: '10px',
                            }}
                        >
                            {isPending ? <Loader2 size={9} className="animate-spin" />
                                : isFinished ? <CheckCircle2 size={9} />
                                : userStatus === 'in_progress' ? <Zap size={9} />
                                : null}
                            {statusConf.label}
                        </div>

                        {/* Action buttons — only show for non-finished */}
                        {!isFinished && (
                            <>
                                {/* Quick link button for quiz/online_test */}
                                {(taskType === 'quiz' || taskType === 'online_test') && assignment.resource_url && (
                                    <a
                                        href={assignment.resource_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold border transition-all"
                                        style={{
                                            background: typeConf.bg,
                                            borderColor: `${typeConf.color}44`,
                                            color: typeConf.color,
                                        }}
                                    >
                                        <ExternalLink size={12} />
                                        Open
                                    </a>
                                )}

                                {userStatus === 'not_started' && (
                                    <button
                                        onClick={() => handleStatusUpdate('in_progress')}
                                        disabled={isPending}
                                        className="btn-secondary flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold"
                                    >
                                        <Play size={11} fill="currentColor" />
                                        Begin
                                    </button>
                                )}
                                {userStatus === 'in_progress' && (
                                    <button
                                        onClick={() => handleStatusUpdate('finished')}
                                        disabled={isPending}
                                        className="btn-primary flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold"
                                    >
                                        <CheckCircle2 size={11} />
                                        Done
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
