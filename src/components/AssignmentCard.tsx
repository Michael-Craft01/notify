'use client'

import { useState, useTransition } from 'react'
import {
    CheckCircle2, ChevronDown, ChevronUp,
    Loader2, Link2, MapPin, FileText
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

export default function AssignmentCard({ assignment, userStatus: init }: AssignmentProps) {
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

    return (
        <div className="border-b border-[var(--color-border)] py-2 flex flex-col gap-1 w-full bg-[var(--color-bg)] rounded-xl border p-4 mb-2">
            <FileText size={16} className="text-white" />
            <div className="text-sm font-semibold text-white">
                {assignment.course_code} {!isDone ? timeLabel : 'Completed'}
            </div>
            <div className="text-base text-white">
                {assignment.title}
            </div>
            <div className="text-xs text-gray-400">
                {due.toLocaleDateString([], { month: 'short', day: 'numeric' })} · {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {assignment.users?.full_name && <> · Posted by {assignment.users.full_name}</>}
            </div>
            {!isDone && (
                <button
                    onClick={() => handleStatus(status === 'not_started' ? 'in_progress' : 'finished')}
                    disabled={isPending}
                    className="mt-2 self-start px-2 py-1 text-sm font-bold bg-[#f97316] text-white transition-all hover:bg-[#fb923c]"
                >
                    {isPending ? <Loader2 size={12} className="inline animate-spin" /> :
                     status === 'not_started' ? 'Begin' : 'Mark Done'}
                </button>
            )}
            {isDone && (
                <div className="mt-2 self-start">
                    <CheckCircle2 size={16} className="text-white" />
                </div>
            )}
            <button
                onClick={() => setExpanded(!expanded)}
                aria-label="Expand details"
                className="self-start mt-2 text-gray-500 hover:text-white transition-colors"
            >
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {expanded && (
                <div className="flex flex-col gap-1 mt-2 text-sm text-gray-300">
                    {assignment.description && <p>{assignment.description}</p>}
                    {assignment.resource_url && <a href={assignment.resource_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors"><Link2 size={12} /> {assignment.resource_url}</a>}
                    {assignment.location && <p className="flex items-center gap-1"><MapPin size={12} /> {assignment.location}</p>}
                </div>
            )}
        </div>
    )
}
