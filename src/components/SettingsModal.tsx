'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Settings, X, User, GraduationCap, Bell, Loader2, Save, LogOut } from 'lucide-react'
import { updateUserProfile } from '@/app/actions/profile'
import { signOut } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'

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
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const router = useRouter()
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        cohort_year: user.cohort_year?.toString() || '',
    })

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogout = async () => {
        setIsLoggingOut(true)
        await signOut()
        setIsLoggingOut(false)
        setIsOpen(false)
    }

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

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(true)}
                className="h-[34px] w-[34px] rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[11px] font-extrabold tracking-[0.04em] text-white/40 hover:bg-orange/10 hover:border-orange/30 hover:text-orange transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                title="Account Settings"
            >
                {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || user.email[0].toUpperCase()}
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[300] animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setIsOpen(false)} />
                    
                    <div className="absolute bottom-12 sm:bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-4 animate-scale-in">
                        <div className="relative w-full bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-orange/10 text-orange">
                                        <Settings size={18} />
                                    </div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Settings</h2>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="max-h-[70vh] sm:max-h-[600px] overflow-y-auto no-scrollbar">
                                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6">
                                    {/* Profile Section */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Profile</p>
                                        
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-white/50 ml-1 uppercase tracking-wider">Full Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange transition-colors" size={16} />
                                                <input 
                                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-[13px] text-white focus:border-orange/30 outline-none transition-all"
                                                    value={formData.full_name}
                                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                                    placeholder="Your full name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-white/50 ml-1 uppercase tracking-wider">Cohort Year</label>
                                            <div className="relative group">
                                                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange transition-colors" size={16} />
                                                <input 
                                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-[13px] text-white focus:border-orange/30 outline-none transition-all"
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

                                    {/* Preferences Section */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Preferences</p>
                                        
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400">
                                                    <Bell size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-bold text-white/80">Push Notifications</p>
                                                    <p className="text-[10px] text-white/30">Get alerts for upcoming tasks</p>
                                                </div>
                                            </div>
                                            <div className="h-6 w-11 rounded-full bg-white/5 border border-white/10 relative cursor-not-allowed opacity-40">
                                                <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white/20 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-5 border-t border-white/5 bg-white/[0.01] flex flex-col gap-2">
                                <button 
                                    disabled={isPending}
                                    onClick={handleSubmit}
                                    className="w-full h-11 bg-orange text-white rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isPending ? <Loader2 size={16} className="animate-spin text-white" /> : (
                                        <>
                                            <Save size={14} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="w-full h-11 bg-white/5 text-white/40 border border-white/5 rounded-xl font-bold text-[12px] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                                    {isLoggingOut ? 'Signing out...' : 'Logout'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
