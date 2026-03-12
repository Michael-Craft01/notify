'use client'

import { useState, useTransition } from 'react'
import {
    Plus, X, Loader2, FileUp, Sparkles,
    ChevronRight, ChevronLeft, BookOpen,
    Link2, MapPin, Monitor, FileText, ClipboardList
} from 'lucide-react'
import { createAssignment } from '@/app/actions/assignments'
import { extractAssignmentAction } from '@/app/actions/ai-assistant'
import AIEnhanceButton from './AIEnhanceButton'

type ModalStep = 'initial' | 'scan' | 'form'
type TaskType = 'assignment' | 'quiz' | 'online_test' | 'physical_test'

const TASK_TYPES: { value: TaskType; label: string; icon: React.ElementType; description: string; accent: string }[] = [
    {
        value: 'assignment',
        label: 'Assignment',
        icon: FileText,
        description: 'Written or submission-based task',
        accent: 'var(--color-primary)',
    },
    {
        value: 'quiz',
        label: 'Quiz',
        icon: ClipboardList,
        description: 'Online quiz — enter access link',
        accent: 'var(--color-warning)',
    },
    {
        value: 'online_test',
        label: 'Online Test',
        icon: Monitor,
        description: 'Formal online test — enter access link',
        accent: 'var(--color-info)',
    },
    {
        value: 'physical_test',
        label: 'Physical Test',
        icon: MapPin,
        description: 'On-campus exam — enter location',
        accent: 'var(--color-success)',
    },
]

export default function AddAssignmentModal({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState<ModalStep>('initial')
    const [isExtracting, setIsExtracting] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [taskType, setTaskType] = useState<TaskType>('assignment')
    const [courseCode, setCourseCode] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [resourceUrl, setResourceUrl] = useState('')
    const [location, setLocation] = useState('')

    const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsExtracting(true)
        setError(null)
        const formData = new FormData()
        formData.append('file', file)
        const result = await extractAssignmentAction(formData)
        setIsExtracting(false)
        if (result.success && result.data) {
            const d = result.data
            if (d.course_code) setCourseCode(d.course_code.toUpperCase())
            if (d.title) setTitle(d.title)
            if (d.description) setDescription(d.description)
            if (d.due_date) setDueDate(new Date(d.due_date).toISOString().slice(0, 16))
            setStep('form')
        } else {
            setError(result.error || 'Could not extract data.')
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
            const result = await createAssignment(fd)
            if (result?.error) {
                setError(result.error)
            } else {
                handleClose()
            }
        })
    }

    const handleClose = () => {
        setIsOpen(false)
        setStep('initial')
        setError(null)
        setTaskType('assignment')
        setCourseCode('')
        setTitle('')
        setDescription('')
        setDueDate('')
        setResourceUrl('')
        setLocation('')
    }

    const selectedType = TASK_TYPES.find(t => t.value === taskType)!

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="btn-primary flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold"
            >
                <Plus size={15} strokeWidth={3} />
                New Task
            </button>
        )
    }

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 modal-overlay animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
            <div
                className="w-full max-w-lg rounded-2xl animate-slide-up overflow-hidden"
                style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border-hover)',
                    boxShadow: 'var(--shadow-lg)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    <div className="flex items-center gap-3">
                        {step !== 'initial' && (
                            <button
                                onClick={() => setStep(step === 'form' ? 'initial' : 'initial')}
                                className="btn-ghost h-8 w-8 rounded-lg flex items-center justify-center mr-1"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        )}
                        <div>
                            <h2
                                className="text-[15px] font-bold"
                                style={{ fontFamily: 'var(--font-outfit), sans-serif' }}
                            >
                                {step === 'initial' ? 'New Task' : step === 'scan' ? 'AI Document Import' : 'Task Details'}
                            </h2>
                            {step === 'form' && (
                                <p className="text-[12px]" style={{ color: 'var(--color-text-dim)' }}>
                                    {selectedType.label} · Fill in the details below
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Step dots */}
                        <div className="hidden sm:flex items-center gap-1.5 mr-3">
                            {(['initial', 'form'] as ModalStep[]).map((s, i) => (
                                <div
                                    key={s}
                                    className="h-1.5 rounded-full transition-all"
                                    style={{
                                        width: step === s ? '20px' : '6px',
                                        background: step === s ? 'var(--color-primary)' : 'var(--color-border-hover)',
                                    }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleClose}
                            className="btn-ghost h-8 w-8 rounded-lg flex items-center justify-center"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* ── Step 1: Choose how to add ── */}
                    {step === 'initial' && (
                        <div className="space-y-3 animate-fade-up">
                            <p className="text-[13px] mb-5" style={{ color: 'var(--color-text-muted)' }}>
                                How would you like to add this task?
                            </p>

                            {/* AI Scan option */}
                            <label
                                className="card rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:border-[var(--color-primary-border)]"
                                style={{ borderColor: 'var(--color-border)' }}
                            >
                                <div
                                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'var(--color-primary-soft)' }}
                                >
                                    {isExtracting ? (
                                        <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                                    ) : (
                                        <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[14px] font-bold mb-0.5">AI Schedule Import</p>
                                    <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                                        Upload a PDF, image, or document — AI extracts the details
                                    </p>
                                </div>
                                <ChevronRight size={16} style={{ color: 'var(--color-text-dim)' }} />
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileScan}
                                    className="sr-only"
                                    disabled={isExtracting}
                                />
                            </label>

                            {/* Manual option */}
                            <button
                                onClick={() => setStep('form')}
                                className="card rounded-xl p-4 flex items-center gap-4 w-full text-left"
                            >
                                <div
                                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'var(--color-surface-2)' }}
                                >
                                    <BookOpen size={18} style={{ color: 'var(--color-text-muted)' }} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[14px] font-bold mb-0.5">Manual Setup</p>
                                    <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                                        Fill in the course, title, deadline and type yourself
                                    </p>
                                </div>
                                <ChevronRight size={16} style={{ color: 'var(--color-text-dim)' }} />
                            </button>

                            {error && (
                                <p className="text-[12px] text-center pt-1" style={{ color: 'var(--color-danger)' }}>{error}</p>
                            )}
                        </div>
                    )}

                    {/* ── Step 2: The form ── */}
                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up">
                            <input type="hidden" name="task_type" value={taskType} />

                            {/* Task Type Selector */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--color-text-muted)' }}>
                                    Task Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TASK_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setTaskType(type.value)}
                                            className="rounded-xl p-3 text-left border transition-all"
                                            style={{
                                                background: taskType === type.value ? `${type.accent}15` : 'var(--color-surface-2)',
                                                borderColor: taskType === type.value ? type.accent + '55' : 'var(--color-border)',
                                                boxShadow: taskType === type.value ? `0 0 12px -4px ${type.accent}` : 'none',
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <type.icon
                                                    size={14}
                                                    style={{ color: taskType === type.value ? type.accent : 'var(--color-text-muted)' }}
                                                />
                                                <span
                                                    className="text-[12px] font-bold"
                                                    style={{ color: taskType === type.value ? type.accent : 'var(--color-text-main)' }}
                                                >
                                                    {type.label}
                                                </span>
                                            </div>
                                            <p className="text-[10px] leading-tight" style={{ color: 'var(--color-text-dim)' }}>
                                                {type.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Course Code + AI Enhance */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>
                                        Course Code
                                    </label>
                                    <AIEnhanceButton
                                        variant="mini"
                                        formData={{ course_code: courseCode, title }}
                                        onEnhance={(d) => {
                                            if (d.course_code) setCourseCode(d.course_code.toUpperCase())
                                            if (d.title) setTitle(d.title)
                                        }}
                                    />
                                </div>
                                <input
                                    name="course_code"
                                    type="text"
                                    value={courseCode}
                                    onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. CSC 301"
                                    required
                                    className="input-field w-full h-11 px-4 text-[13px] font-semibold uppercase tracking-wide"
                                />
                            </div>

                            {/* Title */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>
                                        Title
                                    </label>
                                    <AIEnhanceButton
                                        variant="mini"
                                        formData={{ course_code: courseCode, title, description }}
                                        onEnhance={(d) => {
                                            if (d.title) setTitle(d.title)
                                            if (d.description) setDescription(d.description)
                                        }}
                                    />
                                </div>
                                <input
                                    name="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={
                                        taskType === 'quiz' ? 'e.g. Chapter 5 Quiz'
                                        : taskType === 'online_test' ? 'e.g. Midterm Exam'
                                        : taskType === 'physical_test' ? 'e.g. Final Examination'
                                        : 'e.g. Research Paper Draft'
                                    }
                                    required
                                    className="input-field w-full h-11 px-4 text-[13px]"
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                    Due Date & Time
                                </label>
                                <input
                                    name="due_date"
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    required
                                    className="input-field w-full h-11 px-4 text-[13px]"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>

                            {/* Conditional: Resource URL (quiz / online_test) */}
                            {(taskType === 'quiz' || taskType === 'online_test') && (
                                <div className="animate-fade-in">
                                    <label className="block text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                        <span className="flex items-center gap-1.5">
                                            <Link2 size={11} />
                                            Access Link
                                        </span>
                                    </label>
                                    <input
                                        name="resource_url"
                                        type="url"
                                        value={resourceUrl}
                                        onChange={(e) => setResourceUrl(e.target.value)}
                                        placeholder="https://lms.university.ac.zw/quiz/..."
                                        className="input-field w-full h-11 px-4 text-[13px]"
                                    />
                                </div>
                            )}

                            {/* Conditional: Location (physical_test) */}
                            {taskType === 'physical_test' && (
                                <div className="animate-fade-in">
                                    <label className="block text-[11px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={11} />
                                            Campus Location
                                        </span>
                                    </label>
                                    <input
                                        name="location"
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Block C, Hall 2, Row D"
                                        className="input-field w-full h-11 px-4 text-[13px]"
                                    />
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-muted)' }}>
                                        Notes <span style={{ color: 'var(--color-text-dim)' }}>(optional)</span>
                                    </label>
                                    <AIEnhanceButton
                                        variant="mini"
                                        formData={{ course_code: courseCode, title, description }}
                                        onEnhance={(d) => {
                                            if (d.description) setDescription(d.description)
                                        }}
                                    />
                                </div>
                                <textarea
                                    name="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Any notes or requirements..."
                                    rows={3}
                                    className="input-field w-full px-4 py-3 text-[13px] resize-none"
                                    style={{ borderRadius: '10px' }}
                                />
                            </div>

                            {error && (
                                <div
                                    className="p-3 rounded-xl text-[12px] font-semibold"
                                    style={{ background: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}
                                >
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="btn-secondary flex-1 h-11 rounded-xl text-[13px] font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="btn-primary flex-[2] h-11 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
                                >
                                    {isPending ? (
                                        <><Loader2 size={15} className="animate-spin" /> Saving...</>
                                    ) : (
                                        <>Save Task</>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
