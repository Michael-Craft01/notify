'use client'

import { useState } from 'react'
import { Plus, X, Loader2, FileUp, Shield, Zap, ChevronRight, ChevronLeft, Keyboard, Sparkles } from 'lucide-react'
import { createAssignment } from '@/app/actions/assignments'
import { extractAssignmentAction } from '@/app/actions/oracle'
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
                className="flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-[13px] font-semibold text-black transition-all hover:bg-neutral-200 active:scale-95 shadow-sm"
            >
                <Plus size={16} strokeWidth={2.5} />
                <span>New Directive</span>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-[500] flex items-start justify-center p-4 pt-[10vh]">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={handleClose} />

            <div className="relative w-full max-w-lg bg-[#0b0b0b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-slide-down">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-neutral-900/30">
                    <div className="flex items-center gap-2">
                        {step !== 'initial' && (
                            <button
                                onClick={() => setStep(step === 'form' && courseCode === '' ? 'initial' : step === 'form' ? 'scan' : 'initial')}
                                className="p-1 text-neutral-500 hover:text-white transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        )}
                        <h2 className="text-[13px] font-bold text-white uppercase tracking-wider">
                            {step === 'initial' && 'Deployment Sequence'}
                            {step === 'scan' && 'Scan Intelligence'}
                            {step === 'form' && 'Finalize Directive'}
                        </h2>
                    </div>
                    <button onClick={handleClose} className="p-1 text-neutral-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content Carousel */}
                <div className="p-8">
                    {step === 'initial' && (
                        <div className="space-y-6 text-center py-4">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-white">Choose Vector</h3>
                                <p className="text-sm text-neutral-500">How would you like to log this mission data?</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => setStep('scan')}
                                    className="group flex items-center gap-4 p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--color-primary)]/30 transition-all text-left"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                        <Sparkles size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white">AI Oracle Scan</h4>
                                        <p className="text-[12px] text-neutral-500">Extract intel from image or PDF</p>
                                    </div>
                                    <ChevronRight size={18} className="text-neutral-700 group-hover:text-white transition-colors" />
                                </button>

                                <button
                                    onClick={() => setStep('form')}
                                    className="group flex items-center gap-4 p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all text-left"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400">
                                        <Keyboard size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white">Manual Entry</h4>
                                        <p className="text-[12px] text-neutral-500">Input mission parameters directly</p>
                                    </div>
                                    <ChevronRight size={18} className="text-neutral-700 group-hover:text-white transition-colors" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'scan' && (
                        <div className="space-y-6 py-4">
                            <div className="text-center space-y-2">
                                <Shield className="mx-auto text-[var(--color-primary)]" size={32} />
                                <h3 className="text-lg font-bold text-white tracking-tight">Intelligence Scan</h3>
                                <p className="text-sm text-neutral-500">The Oracle will decrypt your mission docs.</p>
                            </div>

                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleFileScan}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={isExtracting}
                                />
                                <div className={`h-48 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center p-6 gap-4 ${isExtracting ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 animate-pulse' :
                                    'border-white/10 bg-white/[0.02] group-hover:border-[var(--color-primary)]/30 group-hover:bg-[var(--color-primary)]/5'
                                    }`}>
                                    {isExtracting ? (
                                        <>
                                            <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
                                            <span className="text-[13px] font-bold text-[var(--color-primary)] uppercase tracking-widest">Decrypting Intel...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-500 group-hover:text-[var(--color-primary)] transition-all">
                                                <FileUp size={24} />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[14px] font-bold text-neutral-300">Target mission file</span>
                                                <p className="text-[12px] text-neutral-600 font-medium italic">Drop Image or PDF here</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 mb-6 ring-1 ring-[var(--color-primary)]/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                                <div className="space-y-0.5">
                                    <h4 className="text-[12px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-[var(--color-primary)] animation-pulse" />
                                        Oracle Assistant
                                    </h4>
                                    <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">Auto-complete directive</p>
                                </div>
                                <AIEnhanceButton
                                    label="Ignite AI"
                                    formData={{ course_code: courseCode, title, description }}
                                    onEnhance={(data) => {
                                        if (data.title) setTitle(data.title)
                                        if (data.description) setDescription(data.description)
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 text-left">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Directive Code</label>
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
                                        placeholder="CS 101"
                                        required
                                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-[13px] text-white focus:border-[var(--color-primary)] focus:outline-none transition-all font-semibold uppercase"
                                    />
                                </div>
                                <div className="space-y-1.5 text-left">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Deadline</label>
                                        <AIEnhanceButton
                                            variant="mini"
                                            label="AI Time"
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
                                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-[13px] text-white focus:border-[var(--color-primary)] focus:outline-none transition-all [color-scheme:dark] font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 text-left">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Objective Title</label>
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
                                    placeholder="Mission Objective"
                                    required
                                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-[13px] text-white focus:border-[var(--color-primary)] focus:outline-none transition-all font-semibold"
                                />
                            </div>

                            <div className="space-y-1.5 text-left">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Full Parameters</label>
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
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Additional tactical intel..."
                                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-[13px] text-white focus:border-[var(--color-primary)] focus:outline-none transition-all resize-none font-medium text-neutral-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-3 text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[var(--color-primary)]/10"
                            >
                                {isPending ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
                                Deploy Directive
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
