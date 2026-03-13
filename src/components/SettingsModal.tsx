'use client'

import { useState, useTransition } from 'react'
import { Settings, X, User, GraduationCap, Bell, Loader2, Save, LogOut } from 'lucide-react'
import { updateUserProfile } from '@/app/actions/profile'

type SettingsModalProps = {
    user: {
        id: string
        email: string
        full_name: string | null
        cohort_year: number | null
    }
}

export default function SettingsModal({ user }: SettingsModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        cohort_year: user.cohort_year?.toString() || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const data = new FormData()
        data.append('full_name', formData.full_name)
        data.append('cohort_year', formData.cohort_year)

        startTransition(async () => {
            const res = await updateUserProfile(data)
            if (res?.error) {
                alert(res.error)
            } else {
                setIsOpen(false)
            }
        })
    }

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="h-[34px] w-[34px] rounded-full border border-[var(--color-border-hover)] bg-[var(--color-surface-2)] flex items-center justify-center text-[11px] font-extrabold tracking-[0.04em] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer overflow-hidden"
                title="Settings"
            >
                {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || user.email[0].toUpperCase()}
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsOpen(false)} />
            
            <div className="relative w-full max-w-md bg-[var(--color-bg)] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-orange/10 text-orange">
                            <Settings size={20} />
                        </div>
                        <h2 className="text-2xl font-[family-name:var(--font-outfit)] font-black text-white uppercase tracking-tight">Settings</h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-4 flex flex-col gap-6">
                    {/* Profile Section */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Profile Information</p>
                        
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-white/50 ml-1 uppercase tracking-wider">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange transition-colors" size={16} />
                                <input 
                                    className="input-field pl-12 h-12 rounded-2xl bg-white/[0.03] border-white/5 focus:bg-white/[0.06]"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Your full name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-white/50 ml-1 uppercase tracking-wider">Cohort Year</label>
                            <div className="relative group">
                                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange transition-colors" size={16} />
                                <input 
                                    className="input-field pl-12 h-12 rounded-2xl bg-white/[0.03] border-white/5 focus:bg-white/[0.06]"
                                    type="number"
                                    min="2020"
                                    max="2030"
                                    value={formData.cohort_year}
                                    onChange={e => setFormData({ ...formData, cohort_year: e.target.value })}
                                    placeholder="e.g. 2024"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preferences Section (Mocked) */}
                    <div className="space-y-4 pt-2 border-t border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Preferences</p>
                        
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                    <Bell size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white/80">Push Notifications</p>
                                    <p className="text-[11px] text-white/30">Get alerts for upcoming tasks</p>
                                </div>
                            </div>
                            <div className="h-6 w-11 rounded-full bg-orange/20 border border-orange/20 relative cursor-not-allowed opacity-50">
                                <div className="absolute top-1 left-6 h-4 w-4 rounded-full bg-orange" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button"
                            className="flex-1 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/10 font-bold text-[13px] hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                        <button 
                            disabled={isPending}
                            className="flex-[2] h-12 rounded-2xl btn-primary font-bold text-[13px] flex items-center justify-center gap-2"
                        >
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : (
                                <>
                                    <Save size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
