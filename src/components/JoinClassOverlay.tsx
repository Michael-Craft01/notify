'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Search, Hash, CheckCircle2, ChevronRight, GraduationCap, Loader2 } from 'lucide-react'

import { createProgram } from '@/app/actions/programs'

interface Program {
    id: string
    name: string
    invite_code: string
}

export default function JoinClassOverlay({ userId }: { userId: string }) {
    const router = useRouter()
    const supabase = createClient()
    
    const [step, setStep] = useState<'selection' | 'joining'>('selection')
    const [programs, setPrograms] = useState<Program[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [offerCreationCode, setOfferCreationCode] = useState<string | null>(null)
    const [newProgramName, setNewProgramName] = useState('')

    useEffect(() => {
        const fetchPrograms = async () => {
            const { data, error } = await supabase
                .from('programs')
                .select('*')
                .eq('is_public', true)
                .order('name')
            
            if (error) {
                console.error('Fetch Programs Error:', error)
                setError('Could not load classes. Check database permissions.')
            } else if (data) {
                setPrograms(data)
            }
        }
        fetchPrograms()
    }, [supabase])

    const filteredPrograms = programs.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invite_code.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleJoin = async (program: Program | string) => {
        setLoading(true)
        setError(null)
        setOfferCreationCode(null)
        
        try {
            let targetProgramId: string | null = null
            
            if (typeof program === 'string') {
                // Join via Code
                const { data: pData, error: pError } = await supabase
                    .from('programs')
                    .select('id, name')
                    .eq('invite_code', program.toUpperCase())
                    .single()
                
                if (pError || !pData) {
                    setOfferCreationCode(program.toUpperCase())
                    setLoading(false)
                    return
                }
                targetProgramId = pData.id
            } else {
                targetProgramId = program.id
            }

            if (targetProgramId) {
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ program_id: targetProgramId })
                    .eq('id', userId)
                
                if (updateError) throw updateError
                
                setStep('joining')
                setTimeout(() => {
                    router.refresh()
                }, 1500)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to join class')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!offerCreationCode) return
        setLoading(true)
        setError(null)
        try {
            const res = await createProgram(offerCreationCode, newProgramName || offerCreationCode)
            if (res.error) throw new Error(res.error)
            
            setStep('joining')
            setTimeout(() => {
                router.refresh()
            }, 1500)
        } catch (err: any) {
            setError(err.message || 'Failed to create class')
        } finally {
            setLoading(false)
        }
    }

    if (step === 'joining') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-2xl transition-all duration-700">
                <div className="flex flex-col items-center space-y-6 text-center animate-in zoom-in-95 duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl animate-pulse" />
                        <CheckCircle2 className="w-20 h-20 text-blue-400 relative z-10" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Aboard!</h2>
                        <p className="text-blue-200/70 text-lg">Setting up your personalized dashboard...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-xl bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                <div className="p-8 sm:p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                            <GraduationCap className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Join your Class</h1>
                            <p className="text-zinc-400 text-sm">Select your program to see relevant assignments.</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Creation Prompt (Only if code not found) */}
                        {offerCreationCode && (
                            <div className="p-6 bg-blue-600/10 border border-blue-500/30 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <div className="space-y-1">
                                    <h3 className="text-blue-400 font-bold flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" />
                                        Create New Class?
                                    </h3>
                                    <p className="text-zinc-400 text-sm">
                                        The code <span className="text-white font-mono font-bold tracking-widest">{offerCreationCode}</span> hasn't been claimed. 
                                        Want to create it and become the Class Representative?
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <input 
                                        type="text"
                                        placeholder="Full Program Name (e.g. Law 2026)"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                                        value={newProgramName}
                                        onChange={(e) => setNewProgramName(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreate}
                                            disabled={loading}
                                            className="flex-1 bg-white text-black text-sm font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create and Join'}
                                        </button>
                                        <button
                                            onClick={() => setOfferCreationCode(null)}
                                            className="px-4 py-3 text-zinc-500 text-sm font-semibold hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Option A: Search List */}
                        {!offerCreationCode && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text"
                                        placeholder="Search for your class..."
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="max-h-[220px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {filteredPrograms.length > 0 ? (
                                        filteredPrograms.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleJoin(p)}
                                                disabled={loading}
                                                className="w-full group flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800/50 border border-zinc-800/50 hover:border-blue-500/30 rounded-2xl transition-all text-left disabled:opacity-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all text-zinc-400 group-hover:text-blue-400">
                                                        <Hash className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{p.name}</span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center bg-zinc-950/30 rounded-2xl border border-dashed border-zinc-800">
                                            <p className="text-zinc-500 text-sm italic">No open classes found matching your search.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!offerCreationCode && (
                            <div className="relative py-2 text-center text-xs font-bold text-zinc-700 uppercase tracking-widest">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800/50"></div></div>
                                <span className="relative bg-zinc-900 px-4">Or use invite code</span>
                            </div>
                        )}

                        {/* Option B: Invite Code */}
                        {!offerCreationCode && (
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <input 
                                        type="text"
                                        placeholder="Enter secret code..."
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-mono tracking-widest uppercase"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleJoin(inviteCode)}
                                        disabled={loading || !inviteCode}
                                        className="px-8 bg-white hover:bg-blue-50 text-black font-bold rounded-2xl transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center min-w-[120px]"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join'}
                                    </button>
                                </div>
                                {error && (
                                    <p className="text-red-400 text-sm text-center font-medium px-4 animate-in slide-in-from-top-1">
                                        {error}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            `}</style>
        </div>
    )
}
