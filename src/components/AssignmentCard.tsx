'use client'

import { useState, useTransition } from 'react'
import { 
    CheckCircle2, ChevronDown, ChevronUp, Loader2, Link2, 
    MapPin, FileText, ClipboardList, Monitor, Edit2, Trash2,
    Calendar, Play
} from 'lucide-react'
import { updateProgress, deleteAssignment } from '@/app/actions/assignments'

type ProgressStatus = 'not_started' | 'in_progress' | 'finished'
type TaskType = 'assignment' | 'quiz' | 'online_test' | 'physical_test'

const TYPE_ICONS: Record<TaskType, React.ElementType> = {
    assignment: FileText,
    quiz: ClipboardList,
    online_test: Monitor,
    physical_test: MapPin
}

type AssignmentCardProps = {
    assignment: {
        id: string
        course_code: string
        title: string
        description?: string | null
        due_date: string
        created_by: string
        task_type?: TaskType
        resource_url?: string | null
        location?: string | null
        users?: { full_name: string }
    },
    pulse?: { finished_percentage: number, involvement_percentage: number },
    currentUserId: string,
    userStatus: ProgressStatus,
    variant?: 'full' | 'slim'
}

export default function AssignmentCard({ 
    assignment, 
    pulse, 
    currentUserId, 
    userStatus: init, 
    variant = 'full' 
}: AssignmentCardProps) {
    const [status, setStatus] = useState<ProgressStatus>(init)
    const [expanded, setExpanded] = useState(false)
    const [isPending, startTransition] = useTransition()
    
    const isSlim = variant === 'slim'
    const isCreator = assignment.created_by === currentUserId
    const due = new Date(assignment.due_date)
    const hoursLeft = (due.getTime() - Date.now()) / 3600000
    const isOverdue = hoursLeft <= 0 && status !== 'finished'
    
    const timeLabel = (() => {
        if (isOverdue) return `${Math.abs(Math.ceil(hoursLeft / 24))}d overdue`
        if (hoursLeft < 1) return `${Math.floor(hoursLeft * 60)}m left`
        if (hoursLeft < 24) return `${Math.floor(hoursLeft)}h left`
        return `${Math.ceil(hoursLeft / 24)}d left`
    })()

    const handleStatusUpdate = (next: ProgressStatus) => {
        startTransition(async () => {
            const prev = status
            setStatus(next)
            const res = await updateProgress(assignment.id, next)
            if (res?.error) {
                alert(res.error)
                setStatus(prev)
            }
        })
    }

    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this task?')) return
        startTransition(async () => {
            const res = await deleteAssignment(assignment.id)
            if (res?.error) alert(res.error)
        })
    }

    const Icon = assignment.task_type ? TYPE_ICONS[assignment.task_type] : FileText

    const statusHighlight = status === 'finished'
        ? 'rgba(255, 255, 255, 0.05)'
        : isOverdue
            ? 'rgba(239, 68, 68, 0.1)'
            : status === 'in_progress'
                ? 'var(--color-primary-soft)'
                : 'transparent'

    const borderColor = status === 'finished'
        ? 'var(--color-border)'
        : isOverdue
            ? 'rgba(239, 68, 68, 0.3)'
            : status === 'in_progress'
                ? 'var(--color-primary-border)'
                : 'var(--color-border)'

    return (
        <div 
            className={`card animate-fade-up w-full ${isSlim ? 'p-3' : 'p-5'} flex flex-col ${isSlim ? 'gap-1.5' : 'gap-3'} transition-all duration-300 relative group overflow-hidden`}
            style={{ 
                borderColor,
                background: `linear-gradient(145deg, var(--color-surface) 0%, ${statusHighlight} 100%)`
            }}
        >
            {status !== 'finished' && (
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.05)_0%,transparent_70%)]" />
            )}

            <div className={`flex flex-col ${isSlim ? 'gap-1' : 'gap-2'} relative z-10`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className={`${isSlim ? 'p-1.5' : 'p-2'} rounded-lg ${status === 'finished' ? 'bg-white/5 text-white/30' : 'bg-orange/10 text-orange'} border border-white/5`}>
                            <Icon size={isSlim ? 14 : 18} />
                        </div>
                        <div className={`font-outfit ${isSlim ? 'text-[10px]' : 'text-sm'} font-bold tracking-wider uppercase ${status === 'finished' ? 'text-white/30' : 'text-white/60'}`}>
                            {assignment.course_code}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {isCreator && !isSlim && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-white/5 p-1 rounded-lg mr-1">
                                <button
                                    aria-label="Edit assignment"
                                    onClick={(e) => { e.stopPropagation(); /* TODO: Edit */ }}
                                    className="p-1 px-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-all"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button
                                    aria-label="Delete assignment"
                                    onClick={(e) => { e.stopPropagation(); handleDelete() }}
                                    className="p-1 px-1.5 rounded-md hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )}
                        {status !== 'finished' && (
                            <div className={`${isSlim ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2 py-1'} font-bold rounded-md border ${isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-white/70 border-white/5'}`}>
                                {timeLabel}
                            </div>
                        )}
                        {status === 'finished' && (
                            <div className={`badge badge-success ${isSlim ? 'h-5 px-1.5 text-[9px]' : ''}`}>
                                Done
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className={`font-outfit ${isSlim ? 'text-sm' : 'text-xl'} font-bold leading-tight ${status === 'finished' ? 'text-white/40 line-through decoration-white/20' : 'text-white'} transition-all truncate`}>
                        {assignment.title}
                    </h3>
                </div>

                {!isSlim && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/40">
                        <span className="flex items-center gap-1.2">
                            {due.toLocaleDateString([], { month: 'short', day: 'numeric' })} · {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {assignment.users?.full_name && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span>{assignment.users.full_name}</span>
                            </>
                        )}
                    </div>
                )}

                <div className={`${isSlim ? 'mt-1' : 'mt-2'} flex items-center justify-between`}>
                    {status !== 'finished' ? (
                        <button
                            onClick={() => handleStatusUpdate(status === 'not_started' ? 'in_progress' : 'finished')}
                            disabled={isPending}
                            className={`btn-primary rounded-lg ${isSlim ? 'px-3 py-1 text-[11px]' : 'px-5 py-2 text-sm'} shadow-sm`}
                        >
                            {isPending ? <Loader2 size={isSlim ? 12 : 16} className="animate-spin" /> :
                                status === 'not_started' ? 'Begin' : 'Done'}
                        </button>
                    ) : (
                        <div className={`flex items-center gap-1.5 ${isSlim ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-[13px]'} bg-white/5 border border-white/10 rounded-lg text-white/40 font-bold`}>
                            <CheckCircle2 size={isSlim ? 12 : 14} className="text-white/30" /> Completed
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        {isSlim && status !== 'finished' && (
                            <div className="text-[10px] text-white/30 font-medium mr-1">
                                {due.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                        )}
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className={`btn-ghost ${isSlim ? 'p-1.5' : 'p-2'} rounded-lg text-white/30 hover:text-white transition-all transform active:scale-95`}
                            title={expanded ? 'Hide Details' : 'Show Details'}
                        >
                            {expanded ? <ChevronUp size={isSlim ? 16 : 20} /> : <ChevronDown size={isSlim ? 16 : 20} />}
                        </button>
                    </div>
                </div>
            </div>

            {expanded && (
                <div className={`animate-fade-in flex flex-col ${isSlim ? 'gap-3' : 'gap-4'} mt-1 border-t border-white/5 pt-3 z-10`}>
                    {assignment.description && (
                        <p className={`${isSlim ? 'text-[12px]' : 'text-sm'} text-white/70 leading-relaxed font-inter whitespace-pre-wrap`}>
                            {assignment.description}
                        </p>
                    )}
                    
                    <div className="flex flex-col gap-2">
                        {assignment.resource_url && (
                            <a 
                                href={assignment.resource_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`flex items-center gap-2 ${isSlim ? 'text-[12px]' : 'text-sm'} text-orange hover:text-orange-bright transition-colors font-medium break-all`}
                            >
                                <Link2 size={12} /> 
                                {assignment.resource_url}
                            </a>
                        )}
                        {assignment.location && (
                            <div className={`flex items-center gap-2 ${isSlim ? 'text-[12px]' : 'text-sm'} text-white/50`}>
                                <MapPin size={12} />
                                {assignment.location}
                            </div>
                        )}
                    </div>

                    {pulse && (pulse.involvement_percentage > 0 || pulse.finished_percentage > 0) && (
                        <div className={`bg-white/[0.02] ${isSlim ? 'p-3' : 'p-4'} rounded-xl border border-white/5 ${isSlim ? 'space-y-3' : 'space-y-4'}`}>
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30">Pulse</h4>
                                <div className="flex gap-1.5">
                                    <div className="status-dot animate-pulse bg-orange" />
                                    <div className="status-dot animate-pulse bg-white/20" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-white/40 font-medium">Involvement</span>
                                        <span className="text-white/80 font-bold">{Math.round(pulse.involvement_percentage)}%</span>
                                    </div>
                                    <div className="progress-bar h-[3px]">
                                        <div 
                                            className="progress-fill" 
                                            style={{ 
                                                width: `${pulse.involvement_percentage}%`,
                                                background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.4))',
                                                boxShadow: 'none'
                                            }} 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-white/40 font-medium">Completion</span>
                                        <span className="text-orange font-bold">{Math.round(pulse.finished_percentage)}%</span>
                                    </div>
                                    <div className="progress-bar h-[3px]">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${pulse.finished_percentage}%` }} 
                                        />
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
