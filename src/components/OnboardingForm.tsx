'use client'

import { useState } from 'react'
import AIEnhanceButton from './AIEnhanceButton'

export default function OnboardingForm() {
    const [fullName, setFullName] = useState('')
    const [cohortYear, setCohortYear] = useState('')

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

            <button
                type="submit"
                className="btn-primary mt-2 w-full h-14 flex items-center justify-center rounded-xl px-4 text-[14px] font-bold shadow-[0_4px_15px_rgba(249,115,22,0.2)]"
            >
                Complete Setup
            </button>
        </form>
    )
}
