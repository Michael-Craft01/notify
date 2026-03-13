'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import {
    Plus, X, Loader2, Sparkles, ChevronRight, ChevronLeft,
    FileText, ClipboardList, Monitor, MapPin,
    Link2, Calendar, BookOpen, CheckCircle2
} from 'lucide-react'
import { createAssignment } from '@/app/actions/assignments'
import { extractAssignmentAction, enhanceFormAction } from '@/app/actions/ai-assistant'

type TaskType = 'assignment' | 'quiz' | 'online_test' | 'physical_test'

const TYPES: { value: TaskType; label: string; icon: React.ElementType; color: string; bg: string; hint: string }[] = [
    { value: 'assignment',    label: 'Assignment',    icon: FileText,      color: 'var(--color-primary)',  bg: 'var(--color-primary-soft)',  hint: 'Written task or submission' },
    { value: 'quiz',          label: 'Quiz',          icon: ClipboardList, color: 'var(--color-warning)',  bg: 'var(--color-warning-soft)',  hint: 'Online quiz with access link' },
    { value: 'online_test',   label: 'Online Test',   icon: Monitor,       color: 'var(--color-info)',     bg: 'var(--color-info-soft)',     hint: 'Formal test with access link' },
    { value: 'physical_test', label: 'Physical Test', icon: MapPin,        color: 'var(--color-success)',  bg: 'var(--color-success-soft)', hint: 'On-campus exam with location' },
]

const STEPS = ['Type', 'Details', 'Confirm'] as const
type Step = 0 | 1 | 2

function AITinyButton({ onClick, disabled }: { onClick: () => Promise<void>; disabled?: boolean }) {
    const [loading, setLoading] = useState(false)
    const handleClick = async () => {
        if (loading || disabled) return
        setLoading(true)
        try { await onClick() } finally { setLoading(false) }
    }
    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled || loading}
            title="AI enhance"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-30"
            style={{ background: 'var(--color-primary-soft)', border: '1px solid var(--color-primary-border)', color: 'var(--color-primary)' }}
        >
            {loading ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
            AI
        </button>
    )
}

export default function AddAssignmentModal({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState<Step>(0)
    const [isPending, startTransition] = useTransition()
    const [isExtracting, setIsExtracting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)
    const popoutRef = useRef<HTMLDivElement>(null)

    // Form state
    const [taskType, setTaskType] = useState<TaskType>('assignment')
    const [courseCode, setCourseCode] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [resourceUrl, setResourceUrl] = useState('')
    const [location, setLocation] = useState('')

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    const selectedType = TYPES.find(t => t.value === taskType)!
    const needsUrl = taskType === 'quiz' || taskType === 'online_test'
    const needsLocation = taskType === 'physical_test'

    const handleClose = () => {
        setIsOpen(false)
        setStep(0)
        setError(null)
        setDone(false)
        setTaskType('assignment')
        setCourseCode('')
        setTitle('')
        setDescription('')
        setDueDate('')
        setResourceUrl('')
        setLocation('')
    }

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popoutRef.current && !popoutRef.current.contains(e.target as Node)) {
                handleClose()
            }
        }
        if (isOpen) document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [isOpen])

    const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsExtracting(true)
        setError(null)
        const fd = new FormData()
        fd.append('file', file)
        const result = await extractAssignmentAction(fd)
        setIsExtracting(false)
        if (result.success && result.data) {
            const d = result.data
            if (d.course_code) setCourseCode(d.course_code.toUpperCase())
            if (d.title) setTitle(d.title)
            if (d.description) setDescription(d.description)
            if (d.due_date) setDueDate(new Date(d.due_date).toISOString().slice(0, 16))
            setStep(1)
        } else {
            setError(result.error || 'Could not extract data.')
        }
    }

    const canProceedFromDetails = courseCode.trim() && title.trim() && dueDate

    const handleSubmit = () => {
        setError(null)
        startTransition(async () => {
            const fd = new FormData()
            fd.append('task_type', taskType)
            fd.append('course_code', courseCode.trim().toUpperCase())
            fd.append('title', title.trim())
            fd.append('description', description.trim())
            fd.append('due_date', dueDate)
            if (resourceUrl.trim()) fd.append('resource_url', resourceUrl.trim())
            if (location.trim()) fd.append('location', location.trim())

            const result = await createAssignment(fd)
            if (result?.error) {
                setError(result.error)
                setStep(1)
            } else {
                setDone(true)
                setTimeout(handleClose, 1500)
            }
        })
    }

    return (
        <div className="relative" ref={popoutRef}>
            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(v => !v)}
                className="btn-primary flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold"
            >
                <Plus size={15} strokeWidth={3} />
                <span className="hidden sm:inline">New Task</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[300] animate-fade-in">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                        onClick={handleClose} 
                    />
                    
                    {/* Modal Content */}
                    <div className="absolute bottom-12 sm:bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-4 animate-scale-in">
                        <div
                            className="w-full rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
                            style={{
                                background: 'rgba(10,10,10,0.85)',
                                backdropFilter: 'blur(32px)',
                                WebkitBackdropFilter: 'blur(32px)',
                            }}
                        >
                            {/* Header */}
                            <div
                                className="flex items-center justify-between px-5 py-4 border-b border-white/10"
                            >
                                {/* Step back */}
                                <button
                                    onClick={() => step > 0 ? setStep((step - 1) as Step) : handleClose()}
                                    className="btn-ghost h-7 w-7 rounded-lg flex items-center justify-center"
                                >
                                    <ChevronLeft size={15} />
                                </button>

                                {/* Step indicator */}
                                <div className="flex items-center gap-1.5">
                                    {STEPS.map((label, i) => (
                                        <div key={label} className="flex items-center gap-1.5">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <div
                                                    className="rounded-full transition-all"
                                                    style={{
                                                        width: step === i ? '20px' : '6px',
                                                        height: '4px',
                                                        background: step > i
                                                            ? 'var(--color-success)'
                                                            : step === i
                                                            ? 'var(--color-primary)'
                                                            : 'var(--color-border-hover)',
                                                    }}
                                                />
                                            </div>
                                            {i < STEPS.length - 1 && (
                                                <div className="h-px w-3 bg-white/10" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button onClick={handleClose} className="btn-ghost h-8 w-8 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10">
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 max-h-[70vh] sm:max-h-[600px] overflow-y-auto">

                                {/* Step 0: Choose Type */}
                                {step === 0 && (
                                    <div className="space-y-3 animate-fade-up">
                                        <div className="mb-3">
                                            <p className="text-[13px] font-bold mb-0.5 text-white">New Task</p>
                                            <p className="text-[11px] text-white/40">Select the task type to get started</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {TYPES.map((type) => (
                                                <button
                                                    key={type.value}
                                                    onClick={() => { setTaskType(type.value); setStep(1) }}
                                                    className="rounded-xl p-3 text-left border transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{
                                                        background: taskType === type.value ? type.bg : 'var(--color-surface-2)',
                                                        borderColor: taskType === type.value ? `${type.color}44` : 'var(--color-border)',
                                                    }}
                                                >
                                                    <div
                                                        className="h-7 w-7 rounded-lg flex items-center justify-center mb-2"
                                                        style={{ background: type.bg }}
                                                    >
                                                        <type.icon size={14} style={{ color: type.color }} />
                                                    </div>
                                                    <p className="text-[12px] font-bold mb-0.5 text-white">{type.label}</p>
                                                    <p className="text-[10px] leading-snug text-white/30">{type.hint}</p>
                                                </button>
                                            ))}
                                        </div>

                                        <label
                                            className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] cursor-pointer transition-all hover:border-orange/40"
                                        >
                                            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-orange/10 shrink-0">
                                                {isExtracting
                                                    ? <Loader2 size={13} className="animate-spin text-orange" />
                                                    : <Sparkles size={13} className="text-orange" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-bold text-white">AI Import</p>
                                                <p className="text-[10px] text-white/30">Upload PDF or image to auto-fill</p>
                                            </div>
                                            <ChevronRight size={13} className="text-white/20" />
                                            <input type="file" accept="image/*,application/pdf" onChange={handleFileScan} className="sr-only" disabled={isExtracting} />
                                        </label>

                                        {error && <p className="text-[11px] pt-1 text-red-500">{error}</p>}
                                    </div>
                                )}

                                {/* Step 1: Details */}
                                {step === 1 && (
                                    <div className="space-y-3 animate-fade-up">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div
                                                className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                                                style={{
                                                    background: selectedType.bg,
                                                    color: selectedType.color,
                                                    border: `1px solid ${selectedType.color}33`,
                                                }}
                                            >
                                                <selectedType.icon size={9} />
                                                {selectedType.label}
                                            </div>
                                            <p className="text-[12px] font-semibold text-white">Task Details</p>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">Course Code</label>
                                                <AITinyButton
                                                    onClick={async () => {
                                                        const r = await enhanceFormAction({ course_code: courseCode, title })
                                                        if (r.success && r.data) {
                                                            if (r.data.course_code) setCourseCode(r.data.course_code.toUpperCase())
                                                            if (r.data.title) setTitle(r.data.title)
                                                        }
                                                    }}
                                                    disabled={!courseCode && !title}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={courseCode}
                                                onChange={e => setCourseCode(e.target.value.toUpperCase())}
                                                placeholder="e.g. CSC 301"
                                                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[13px] font-semibold uppercase tracking-wide text-white focus:border-orange/30 outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">Title</label>
                                                <AITinyButton
                                                    onClick={async () => {
                                                        const r = await enhanceFormAction({ course_code: courseCode, title, description })
                                                        if (r.success && r.data) {
                                                            if (r.data.title) setTitle(r.data.title)
                                                            if (r.data.description) setDescription(r.data.description)
                                                        }
                                                    }}
                                                    disabled={!courseCode && !title}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                                placeholder="Enter task title..."
                                                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[13px] text-white focus:border-orange/30 outline-none transition-all text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1 text-white/40">
                                                <span className="flex items-center gap-1"><Calendar size={10} /> Due Date & Time</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={dueDate}
                                                onChange={e => setDueDate(e.target.value)}
                                                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[13px] text-white focus:border-orange/30 outline-none transition-all"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>

                                        {needsUrl && (
                                            <div className="animate-fade-in">
                                                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1 text-white/40">
                                                    <span className="flex items-center gap-1"><Link2 size={10} /> Access Link</span>
                                                </label>
                                                <input
                                                    type="url"
                                                    value={resourceUrl}
                                                    onChange={e => setResourceUrl(e.target.value)}
                                                    placeholder="https://..."
                                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[12px] text-white focus:border-orange/30 outline-none transition-all"
                                                />
                                            </div>
                                        )}

                                        {needsLocation && (
                                            <div className="animate-fade-in">
                                                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1 text-white/40">
                                                    <span className="flex items-center gap-1"><MapPin size={10} /> Campus Location</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={location}
                                                    onChange={e => setLocation(e.target.value)}
                                                    placeholder="e.g. Block C, Hall 2"
                                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[13px] text-white focus:border-orange/30 outline-none transition-all"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] mb-1 text-white/40">
                                                Notes
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder="Any requirements or notes..."
                                                rows={2}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[12px] text-white focus:border-orange/30 outline-none transition-all resize-none"
                                            />
                                        </div>

                                        {error && <p className="text-[11px] text-red-500">{error}</p>}

                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={!canProceedFromDetails}
                                            className="w-full h-11 bg-orange text-white rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                                        >
                                            Review Details <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* Step 2: Confirm */}
                                {step === 2 && (
                                    <div className="space-y-3 animate-fade-up">
                                        {done ? (
                                            <div className="py-8 flex flex-col items-center gap-4">
                                                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center animate-scale-in">
                                                    <CheckCircle2 size={32} className="text-green-500" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[15px] font-black uppercase tracking-widest text-white">Task Synchronized</p>
                                                    <p className="text-[11px] text-white/40 mt-1">Successfully added to your dashboard.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-[12px] font-bold text-white mb-2">Confirm Task</p>
                                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                                                    <SummaryRow label="Type">
                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1" style={{ background: selectedType.bg, color: selectedType.color }}>
                                                            <selectedType.icon size={9} /> {selectedType.label}
                                                        </span>
                                                    </SummaryRow>
                                                    <SummaryRow label="Course"><span className="text-white font-bold">{courseCode}</span></SummaryRow>
                                                    <SummaryRow label="Title"><span className="text-white">{title}</span></SummaryRow>
                                                    <SummaryRow label="Due"><span className="text-white/80">{new Date(dueDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></SummaryRow>
                                                    {resourceUrl && <SummaryRow label="Link"><span className="truncate block max-w-[180px] text-blue-400">{resourceUrl}</span></SummaryRow>}
                                                    {location && <SummaryRow label="Location"><span className="text-white/80">{location}</span></SummaryRow>}
                                                    {description && <SummaryRow label="Notes"><span className="text-white/60 leading-relaxed">{description}</span></SummaryRow>}
                                                </div>

                                                {error && <p className="text-[11px] text-red-500">{error}</p>}

                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        onClick={() => setStep(1)}
                                                        className="flex-1 h-11 bg-white/5 border border-white/10 text-white rounded-xl text-[12px] font-bold hover:bg-white/10 transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={handleSubmit}
                                                        disabled={isPending}
                                                        className="flex-[2] h-11 bg-orange text-white rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                                    >
                                                        {isPending ? <><Loader2 size={13} className="animate-spin" /> Synchronizing...</> : 'Confirm & Save'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4">
            <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-widest text-white/20 pt-0.5">{label}</span>
            <div className="flex-1 min-w-0 text-[12px]">{children}</div>
        </div>
    )
}
