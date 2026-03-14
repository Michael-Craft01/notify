'use client'

import { useState, useMemo } from 'react'
import AIEnhanceButton from './AIEnhanceButton'
import { Plus, Search, Check } from 'lucide-react'

export default function OnboardingForm({ programs: initialPrograms }: { programs: any[] }) {
    const [fullName, setFullName] = useState('')
    const [cohortYear, setCohortYear] = useState('')
    const [programId, setProgramId] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [isCreatingNew, setIsCreatingNew] = useState(false)
    const [newProgramName, setNewProgramName] = useState('')

    const filteredPrograms = useMemo(() => {
        if (!searchQuery) return initialPrograms
        return initialPrograms.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [initialPrograms, searchQuery])

    const selectedProgram = initialPrograms.find(p => p.id === programId)

    return (
        <form action="/auth/complete-profile" method="POST" className="w-full flex flex-col gap-6 relative z-10">
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 mb-2">
                <div className="space-y-0.5 text-left">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Profile Setup</h4>
                    <p className="text-[9px] text-neutral-500 font-medium">Auto-fill via AI</p>
                </div>
                <AIEnhanceButton
                    label="Enhance"
                    formData={{ full_name: fullName, cohort_year: cohortYear }}
                    onEnhance={(data) => {
                        if (data.full_name) setFullName(data.full_name)
                        if (data.cohort_year) setCohortYear(data.cohort_year)
                    }}
                />
            </div>

            <div className="space-y-2 text-left">
                <div className="flex items-center justify-between px-1">
                    <label htmlFor="full_name" className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                        Full Name
                    </label>
                    <AIEnhanceButton
                        variant="mini"
                        formData={{ full_name: fullName }}
                        onEnhance={(data) => {
                            if (data.full_name) setFullName(data.full_name)
                        }}
                    />
                </div>
                <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Liam Carter"
                    required
                    className="input-field w-full h-12 px-4 shadow-inner"
                />
            </div>

            <div className="space-y-2 text-left">
                <div className="flex items-center justify-between px-1">
                    <label htmlFor="cohort_year" className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                        Cohort / Grad Year
                    </label>
                    <AIEnhanceButton
                        variant="mini"
                        formData={{ cohort_year: cohortYear, full_name: fullName }}
                        onEnhance={(data) => {
                            if (data.cohort_year) setCohortYear(data.cohort_year)
                        }}
                    />
                </div>
                <input
                    id="cohort_year"
                    name="cohort_year"
                    type="number"
                    value={cohortYear}
                    onChange={(e) => setCohortYear(e.target.value)}
                    placeholder="e.g. 2026"
                    min="2024"
                    max="2035"
                    required
                    className="input-field w-full h-12 px-4 shadow-inner"
                />
            </div>

            <div className="space-y-4 text-left">
                <div className="flex items-center justify-between px-1">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                        Academic Program
                    </label>
                </div>

                {!isCreatingNew ? (
                    <div className="space-y-3">
                        {/* Search Input */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange transition-colors" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search e.g. CS-2028 or Law..."
                                className="input-field w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-xl text-[13px] outline-none focus:border-orange/30 transition-all font-medium"
                            />
                        </div>

                        {/* Program List */}
                        <div className="max-h-[180px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                            {filteredPrograms.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                        setProgramId(p.id)
                                        setSearchQuery('')
                                    }}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                                        programId === p.id 
                                            ? 'bg-orange/10 border-orange/30 text-white shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/[0.08] hover:border-white/10'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <p className="text-[12px] font-bold">{p.name}</p>
                                        <p className="text-[10px] font-medium opacity-50 uppercase tracking-wider">{p.id}</p>
                                    </div>
                                    {programId === p.id && <Check size={14} className="text-orange" />}
                                </button>
                            ))}

                            {filteredPrograms.length === 0 && (
                                <div className="text-center py-4 space-y-3">
                                    <p className="text-[11px] text-white/30 font-medium">No matches found.</p>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingNew(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange/10 border border-orange/20 rounded-lg text-orange text-[11px] font-bold hover:bg-orange/20 transition-all"
                                    >
                                        <Plus size={14} />
                                        Create & Join "{searchQuery}"
                                    </button>
                                </div>
                            )}
                        </div>

                        {filteredPrograms.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsCreatingNew(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-white/30 text-[11px] font-bold hover:border-orange/30 hover:text-orange transition-all"
                            >
                                <Plus size={14} />
                                Can't find yours? Create it
                            </button>
                        )}
                        
                        <input type="hidden" name="program_id" value={programId} required />
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in p-5 rounded-2xl bg-orange/5 border border-orange/10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-orange/80">New Program Identity</label>
                            <input
                                name="new_program_name"
                                type="text"
                                placeholder="e.g. Computer Science 2026"
                                required
                                className="input-field w-full h-11 px-4 bg-black/40 border-white/10 focus:border-orange/30 text-[13px] font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-orange/80">Unique ID (Abbreviation)</label>
                            <input
                                name="new_program_id"
                                type="text"
                                placeholder="e.g. CS-2026 (Short & clear)"
                                required
                                className="input-field w-full h-11 px-4 bg-black/40 border-white/10 focus:border-orange/30 text-[13px] font-black uppercase"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCreatingNew(false)}
                            className="text-[10px] font-bold text-white/20 hover:text-white/40 uppercase tracking-widest pl-1"
                        >
                            ← Back to Search
                        </button>
                        {/* Add hidden inputs to ensure form submission includes these even if they are dynamic */}
                        <input type="hidden" name="is_creating_new" value="true" />
                    </div>
                )}
            </div>

            <button
                type="submit"
                className="btn-primary mt-2 w-full h-14 flex items-center justify-center rounded-xl px-4 text-[14px] font-bold shadow-[0_4px_15px_rgba(249,115,22,0.2)]"
            >
                Complete Setup
            </button>
        </form>
    )
}
