'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { 
    MessageSquare, X, Send, Sparkles, Loader2, 
    Bot, User, ChevronRight, CornerDownRight 
} from 'lucide-react'
import { askNotifyAI } from '@/app/actions/ai-assistant'
import { createAssignment, updateAssignment, deleteAssignment } from '@/app/actions/assignments'

type Message = {
    role: 'user' | 'ai'
    content: string
    intent?: string
    actionData?: any
}

export default function NotifyAIChat({ currentAssignments }: { currentAssignments: any[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: "Hey! I'm NotifyAI. I can help you add tasks, find what's due, or update your schedule. Just say something like 'Add a quiz for MP201 tomorrow'." }
    ])
    const [input, setInput] = useState('')
    const [isPending, startTransition] = useTransition()
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isPending])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isPending) return

        const userMsg = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])

        startTransition(async () => {
            const res = await askNotifyAI(userMsg, currentAssignments)
            
            if (res.error) {
                setMessages(prev => [...prev, { role: 'ai', content: res.error }])
                return
            }

            // Handle tool execution if intent requires it
            let finalMessage = res.message || "Done!"
            
            if (res.intent === 'create' && res.actionData) {
                const fd = new FormData()
                Object.entries(res.actionData).forEach(([k, v]) => fd.append(k, v as string))
                const createRes = await createAssignment(fd)
                if (createRes.error) finalMessage = `I tried to create that, but: ${createRes.error}`
            } 
            else if (res.intent === 'delete' && res.actionData?.id) {
                const delRes = await deleteAssignment(res.actionData.id)
                if (delRes.error) finalMessage = `I couldn't delete that: ${delRes.error}`
            }

            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: finalMessage,
                intent: res.intent,
                actionData: res.actionData 
            }])
        })
    }

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`btn-ghost h-9 w-9 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-orange/10 text-orange shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-white/5 text-white/40 hover:text-white'}`}
                title="NotifyAI Chat"
            >
                <Sparkles size={16} fill={isOpen ? 'currentColor' : 'none'} className={isPending ? 'animate-pulse' : ''} />
            </button>

            {/* Chat Popup */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[1px] md:hidden" onClick={() => setIsOpen(false)} />
                    <div className="fixed md:absolute right-4 md:right-0 bottom-20 md:bottom-auto md:top-full mt-4 z-[210] w-[calc(100vw-32px)] md:w-[380px] h-[500px] animate-scale-in">
                        <div 
                            className="flex flex-col h-full rounded-[28px] border border-white/10 shadow-2xl overflow-hidden"
                            style={{ 
                                background: 'rgba(12, 12, 12, 0.85)',
                                backdropFilter: 'blur(32px)',
                                WebkitBackdropFilter: 'blur(32px)'
                            }}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange to-orange-bright text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                                        <Bot size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white">NotifyAI</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-orange animate-pulse" />
                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-tight">Active</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div 
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth no-scrollbar"
                            >
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                                        <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border ${m.role === 'user' ? 'bg-white/10 border-white/10 text-white/60' : 'bg-orange/10 border-orange/10 text-orange'}`}>
                                                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                            </div>
                                            <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed font-medium ${m.role === 'user' ? 'bg-white/5 text-white/80 rounded-tr-none' : 'bg-white/5 text-white/90 border border-white/5 rounded-tl-none shadow-sm'}`}>
                                                {m.content}
                                                {m.intent && m.intent !== 'chat' && (
                                                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange/60">
                                                        <CornerDownRight size={10} />
                                                        {m.intent} successful
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isPending && (
                                    <div className="flex justify-start animate-fade-in">
                                        <div className="flex gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-orange/10 border border-orange/10 text-orange flex items-center justify-center">
                                                <Bot size={14} />
                                            </div>
                                            <div className="p-3 rounded-2xl bg-white/5 flex gap-1 items-center h-9">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:-0.3s]" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:-0.15s]" />
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <form 
                                onSubmit={handleSend}
                                className="p-4 border-t border-white/10 bg-white/[0.01]"
                            >
                                <div className="relative group">
                                    <input 
                                        type="text"
                                        placeholder="Ask NotifyAI..."
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        disabled={isPending}
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-[13px] text-white placeholder:text-white/20 outline-none focus:border-orange/30 focus:bg-white/[0.07] transition-all disabled:opacity-50"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!input.trim() || isPending}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-orange text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-0 disabled:scale-90"
                                    >
                                        <Send size={15} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
