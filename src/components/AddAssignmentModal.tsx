'use client'

import { useState } from 'react'
import { Plus, X, Loader2, FileUp, Shield, Zap, ChevronRight, ChevronLeft, Keyboard, Sparkles } from 'lucide-react'
import { createAssignment } from '@/app/actions/assignments'
import { extractAssignmentAction } from '@/app/actions/ai-assistant'
import AIEnhanceButton from './AIEnhanceButton'

type ModalStep = 'initial' | 'scan' | 'form'

export default function AddAssignmentModal({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState<ModalStep>('initial')
    const [isPending, setIsPending] = useState(false)
    const [isExtracting, setIsExtracting] = useState(false)

    // Form States
    const [courseCode, setCourseCode] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')

    const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsExtracting(true)
        const formData = new FormData()
        formData.append('file', file)

        const result = await extractAssignmentAction(formData)
        setIsExtracting(false)

        if (result.success && result.data) {
            const data = result.data
            if (data.course_code) setCourseCode(data.course_code.toUpperCase())
            if (data.title) setTitle(data.title)
            if (data.description) setDescription(data.description)
            if (data.due_date) {
                const date = new Date(data.due_date)
                setDueDate(date.toISOString().slice(0, 16))
            }
            setStep('form') // Move to review form
        } else if (result.error) {
            alert(result.error)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsPending(true)
        const formData = new FormData(e.currentTarget)
        const result = await createAssignment(formData)
        setIsPending(false)
        if (result?.error) {
            alert(result.error)
        } else {
            handleClose()
        }
    }

    const handleClose = () => {
        setCourseCode('')
        setTitle('')
        setDescription('')
        setDueDate('')
        setStep('initial')
        setIsOpen(false)
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[13px] font-bold text-black transition-all hover:bg-neutral-200 active:scale-95 shadow-lg"
            >
                <Plus size={16} strokeWidth={3} />
                <span>New Task</span>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-[500] flex items-start justify-center p-4 pt-[10vh]">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={handleClose} />

            <div className="relative w-full max-w-lg bg-[#0b0b0b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-slide-down">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-neutral-900/30">
                    <div className="flex items-center gap-3">
                        {step !== 'initial' && (
                            <button
                                onClick={() => setStep(step === 'form' && courseCode === '' ? 'initial' : step === 'form' ? 'scan' : 'initial')}
                                className="p-1 text-neutral-500 hover:text-white transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-outfit">
                            {step === 'initial' && 'Task Configuration'}
                            {step === 'scan' && 'Document Import'}
                            {step === 'form' && 'Finalize Schedule'}
                        </h2>
                    </div>
                    <button onClick={handleClose} className="p-1 text-neutral-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content Carousel */}
                <div className="p-10">
                    {step === 'initial' && (
                        <div className="space-y-8 text-center py-4">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white font-outfit">Add New Task</h3>
                                <p className="text-[13px] text-neutral-500 font-medium">Select your preferred method for record entry.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => setStep('scan')}
                                    className="group flex items-center gap-5 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--color-primary)]/30 transition-all text-left shadow-sm"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-[var(--color-primary-soft)] flex items-center justify-center text-[var(--color-primary)]">
                                        <Sparkles size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white mb-0.5">AI Schedule Import</h4>
                                        <p className="text-[12px] text-neutral-500 font-medium">Extract details from images or PDF files</p>
                                    </div>
                                    <ChevronRight size={18} className="text-neutral-700 group-hover:text-white transition-colors" />
                                </button>

                                <button
                                    onClick={() => setStep('form')}
                                    className="group flex items-center gap-5 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all text-left shadow-sm"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400">
                                        <Keyboard size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white mb-0.5">Manual Setup</h4>
                                        <p className="text-[12px] text-neutral-500 font-medium">Enter task details manually</p>
                                    </div>
                                    <ChevronRight size={18} className="text-neutral-700 group-hover:text-white transition-colors" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'scan' && (
                        <div className="space-y-8 py-4">
                            <div className="text-center space-y-3">
                                <div className="mx-auto h-12 w-12 rounded-2xl bg-[var(--color-primary-soft)] flex items-center justify-center text-[var(--color-primary)]">
                                    <FileUp size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-white font-outfit">Document Parser</h3>
                                <p className="text-[13px] text-neutral-500 font-medium tracking-wide">Upload your schedule for automated processing.</p>
                            </div>

                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileScan}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={isExtracting}
                                />
                                <div className={`h-52 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center p-8 gap-5 ${isExtracting ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] animate-pulse' :
                                    'border-white/10 bg-white/[0.02] group-hover:border-[var(--color-primary)]/30 group-hover:bg-white/[0.04]'
                                    }`}>
                                    {isExtracting ? (
                                        <>
                                            <Loader2 className="animate-spin text-[var(--color-primary)]" size={36} />
                                            <span className="text-[11px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em]">Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-500 group-hover:text-white transition-all shadow-inner">
                                                <Plus size={28} />
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[14px] font-bold text-neutral-200">Click to upload file</span>
                                                <p className="text-[11px] text-neutral-600 font-semibold uppercase tracking-widest">Supports PDF and Images</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 mb-8 ring-1 ring-white/5 shadow-premium">
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Sparkles size={14} className="text-[var(--color-primary)]" />
                                        AI Assistant
                                    </h4>
                                    <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest">Enhanced Data entry</p>
                                </div>
                                <AIEnhanceButton
                                    label="Enhance with AI"
                                    formData={{ course_code: courseCode, title, description }}
                                    onEnhance={(data) => {
                                        if (data.title) setTitle(data.title)
                                        if (data.description) setDescription(data.description)
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2.5 text-left">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Course Code</label>
                                        <AIEnhanceButton
                                            variant="mini"
                                            formData={{ course_code: courseCode }}
                                            onEnhance={(data) => {
                                                if (data.course_code) setCourseCode(data.course_code.toUpperCase())
                                                if (data.title) setTitle(data.title)
                                                if (data.description) setDescription(data.description)
                                            }}
                                        />
                                    </div>
                                    <input
                                        name="course_code"
                                        value={courseCode}
                                        onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                                        placeholder="CS-101"
                                        required
                                        className="w-full rounded-xl border border-white/10 bg-black/60 px-5 py-3 text-[14px] text-white focus:border-[var(--color-primary)] focus:outline-none transition-all font-bold uppercase tracking-tight shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2.5 text-left">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Due Date</label>
                                        <AIEnhanceButton
                                            variant="mini"
                                            label="AI Detect"
                                            formData={{ due_date: dueDate, title, course_code: courseCode }}
                                            onEnhance={(data) => {
                                                if (data.due_date) setDueDate(data.due_date)
                                            }}
                                        />
                                    </div>
                                    <input
                                        name="due_date"
                                        type="datetime-local"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-white/10 bg-black/60 px-5 py-3 text-[14px] text-white focus:border-[var(--color-primary)] focus:outline-none transition-all [color-scheme:dark] font-bold shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5 text-left">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Task Title</label>
                                    <AIEnhanceButton
                                        variant="mini"
                                        formData={{ title, course_code: courseCode }}
                                        onEnhance={(data) => {
                                            if (data.title) setTitle(data.title)
                                            if (data.description) setDescription(data.description)
                                        }}
                                    />
                                </div>
                                <input
                                    name="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Task Title"
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-black/60 px-5 py-3 text-[14px] text-white focus:border-[var(--color-primary)] focus:outline-none transition-all font-bold tracking-tight shadow-inner"
                                />
                            </div>

                            <div className="space-y-2.5 text-left">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Additional Context</label>
                                    <AIEnhanceButton
                                        variant="mini"
                                        formData={{ description, title, course_code: courseCode }}
                                        onEnhance={(data) => {
                                            if (data.description) setDescription(data.description)
                                        }}
                                    />
                                </div>
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Note specific requirements or details..."
                                    className="w-full rounded-xl border border-white/10 bg-black/60 px-5 py-3 text-[14px] text-neutral-400 focus:border-[var(--color-primary)] focus:outline-none transition-all resize-none font-medium shadow-inner"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-14 flex items-center justify-center gap-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-black uppercase tracking-[0.2em] transition-all hover:brightness-110 active:scale-[0.98] shadow-glow"
                            >
                                {isPending ? <Loader2 className="animate-spin" size={20} /> : <Zap size={18} fill="currentColor" />}
                                Save Task
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer Progress */}
                <div className="px-8 pb-6 flex items-center justify-center gap-2">
                    <div className={`h-1 rounded-full transition-all duration-300 ${step === 'initial' ? 'w-8 bg-[var(--color-primary)]' : 'w-2 bg-white/10'}`} />
                    <div className={`h-1 rounded-full transition-all duration-300 ${step === 'scan' ? 'w-8 bg-[var(--color-primary)]' : 'w-2 bg-white/10'}`} />
                    <div className={`h-1 rounded-full transition-all duration-300 ${step === 'form' ? 'w-8 bg-[var(--color-primary)]' : 'w-2 bg-white/10'}`} />
                </div>
            </div>
        </div>
    )
}
