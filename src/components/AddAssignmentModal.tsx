'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createAssignment } from '@/app/actions/assignments'

export default function AddAssignmentModal({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsPending(true)

        const formData = new FormData(e.currentTarget)
        const result = await createAssignment(formData)

        setIsPending(false)
        if (result?.error) {
            alert(result.error) // Basic error handling, can enhance later
        } else {
            setIsOpen(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 z-50 hover:bg-[var(--color-primary-hover)] lg:static lg:h-10 lg:w-auto lg:rounded-lg lg:px-4 lg:py-2 lg:gap-2"
            >
                <Plus size={24} className="lg:h-5 lg:w-5" />
                <span className="hidden lg:inline font-semibold text-sm">Log Deadline</span>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] shadow-2xl overflow-hidden border border-[var(--color-surface-hover)]">

                <div className="flex items-center justify-between border-b border-[var(--color-surface-hover)] p-4 bg-[var(--color-background)]">
                    <h2 className="text-lg font-bold text-[var(--color-text-main)]">New Assignment</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-1.5">
                            <label htmlFor="course_code" className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                                Course Code
                            </label>
                            <input
                                id="course_code"
                                name="course_code"
                                type="text"
                                placeholder="CSC 301"
                                required
                                className="rounded-lg border border-[var(--color-surface-hover)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-main)] placeholder-slate-600 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] uppercase"
                            />
                        </div>

                        <div className="flex-1 flex flex-col gap-1.5">
                            <label htmlFor="due_date" className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                                Due Date & Time
                            </label>
                            <input
                                id="due_date"
                                name="due_date"
                                type="datetime-local"
                                required
                                className="rounded-lg border border-[var(--color-surface-hover)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-main)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="title" className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                            Assignment Title
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            placeholder="e.g. Data Structures Lab 3"
                            required
                            className="rounded-lg border border-[var(--color-surface-hover)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-main)] placeholder-slate-600 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="description" className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                            Details (Optional)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="Any specific instructions or links..."
                            className="rounded-lg border border-[var(--color-surface-hover)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-main)] placeholder-slate-600 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Logging...' : 'Log & Propose Deadline'}
                    </button>
                </form>
            </div>
        </div>
    )
}
