'use client'

import { useState, useTransition } from 'react'
import {
    CheckCircle2, ChevronDown, ChevronUp,
    Loader2, Link2, MapPin, FileText, ClipboardList, Monitor
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
    pulse?: { finished_percentage: number; involvement_percentage: number }
    userStatus: ProgressStatus
    currentUserId: string
}

const TYPE_ICONS: Record<TaskType, React.ElementType> = {
    assignment: FileText,
    quiz: ClipboardList,
    online_test: Monitor,
    physical_test: MapPin
}

export default function AssignmentCard({ assignment, pulse, userStatus: init }: AssignmentProps) {
    const [status, setStatus] = useState<ProgressStatus>(init)
    const [expanded, setExpanded] = useState(false)
    const [isPending, startTransition] = useTransition()

    const due      = new Date(assignment.due_date)
    const hoursLeft = (due.getTime() - Date.now()) / 3600000
    const isOverdue = hoursLeft <= 0
    const isDone    = status === 'finished'

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

    const Icon = assignment.task_type ? TYPE_ICONS[assignment.task_type] : FileText

    return (
        <div className="w-full bg-[#0a0a0a] rounded-[12px] border border-[var(--color-border)] p-5 flex flex-col gap-2">
            <div className="flex flex-col gap-1.5">
                <Icon size={16} className="text-white mb-0.5" />

                <div className="text-[15px] font-bold text-white tracking-wide">
                    {assignment.course_code} {!isDone && <span className="font-bold">{timeLabel}</span>}
                </div>

                <div className="text-[17px] font-medium text-white mb-0.5">
                    {assignment.title}
                </div>

                <div className="text-[13px] text-[#9CA3AF] mb-3">
                    {due.toLocaleDateString([], { month: 'short', day: 'numeric' })} · {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {assignment.users?.full_name && <> · Posted by {assignment.users.full_name}</>}
                </div>

                {!isDone && (
                    <button
                        onClick={() => handleStatus(status === 'not_started' ? 'in_progress' : 'finished')}
                        disabled={isPending}
                        className="self-start px-3 py-1.5 text-[14px] font-bold bg-[#f97316] text-white transition-all hover:bg-[#fb923c] rounded-[4px] mb-2"
                    >
                        {isPending ? <Loader2 size={14} className="inline animate-spin" /> :
                         status === 'not_started' ? 'Begin' : 'Mark Done'}
                    </button>
                )}
                {isDone && (
                    <div className="self-start mb-2">
                        <CheckCircle2 size={18} className="text-[#f97316]" />
                    </div>
                )}

                <button
                    onClick={() => setExpanded(!expanded)}
                    aria-label="Expand details"
                    className="self-start text-[#6B7280] hover:text-white transition-colors"
                >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {expanded && (
                <div className="flex flex-col gap-1 mt-2 text-[14px] text-[#D1D5DB] border-t border-[var(--color-border)] pt-3">
                    {assignment.description && <p>{assignment.description}</p>}
                    {assignment.resource_url && <a href={assignment.resource_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors text-[#60A5FA]"><Link2 size={14} /> {assignment.resource_url}</a>}
                    {assignment.location && <p className="flex items-center gap-1.5"><MapPin size={14} /> {assignment.location}</p>}

                    {pulse && (pulse.involvement_percentage > 0 || pulse.finished_percentage > 0) && (
                        <div className="mt-3 bg-[var(--color-surface-2)] p-3 rounded-lg border border-[var(--color-border)]">
                            <p className="text-[12px] font-bold text-white mb-2 tracking-wide uppercase">Cohort Progress</p>

                            <div className="flex flex-col gap-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-[#9CA3AF]">Involvement</span>
                                        <span className="font-medium text-white">{Math.round(pulse.involvement_percentage)}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${pulse.involvement_percentage}%` }} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-[#9CA3AF]">Completion</span>
                                        <span className="font-medium text-white">{Math.round(pulse.finished_percentage)}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${pulse.finished_percentage}%`, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
