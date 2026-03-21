'use client'

import { useState, useMemo } from 'react'
import { LayoutGrid, List, Search, Filter, X } from 'lucide-react'
import AssignmentCard from './AssignmentCard'

type AssignmentContainerProps = {
    title: string
    count: number
    assignments: any[]
    currentUserId: string
}

const TASK_TYPES = [
    { id: 'all', label: 'All Tasks' },
    { id: 'assignment', label: 'Assignments' },
    { id: 'quiz', label: 'Quizzes' },
    { id: 'online_test', label: 'Online Tests' },
    { id: 'physical_test', label: 'Physical' },
]

export default function AssignmentContainer({ 
    title, 
    count, 
    assignments, 
    currentUserId 
}: AssignmentContainerProps) {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('all')

    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => {
            const matchesSearch = 
                a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                a.course_code.toLowerCase().includes(searchQuery.toLowerCase())
            
            const matchesFilter = activeFilter === 'all' || a.task_type === activeFilter
            
            return matchesSearch && matchesFilter
        })
    }, [assignments, searchQuery, activeFilter])

    return (
        <section className="animate-fade-up flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-[family-name:var(--font-outfit)] font-black text-white leading-tight uppercase tracking-tight">{title}</h2>
                    <p className="text-[13px] font-bold text-white/30 uppercase tracking-[0.1em]">{filteredAssignments.length} of {count} visible</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search Bar */}
                    <div className="relative group flex-1 md:flex-none md:min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange transition-colors" size={14} />
                        <input 
                            type="text"
                            placeholder="Search course or title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[13px] text-white/80 placeholder:text-white/20 outline-none focus:border-orange/30 focus:bg-white/[0.05] transition-all"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 rounded-sm"
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center p-1 bg-white/5 border border-white/5 rounded-xl">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
                            title="List View"
                            aria-label="List View"
                            aria-pressed={viewMode === 'list'}
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
                            title="Grid View"
                            aria-label="Grid View"
                            aria-pressed={viewMode === 'grid'}
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                {TASK_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => setActiveFilter(type.id)}
                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${
                            activeFilter === type.id 
                                ? 'bg-orange/10 border-orange/40 text-orange' 
                                : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:border-white/10'
                        }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {filteredAssignments.length > 0 ? (
                <div className={
                    viewMode === 'grid' 
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
                        : "flex flex-col gap-4"
                }>
                    {filteredAssignments.map((a) => (
                        <AssignmentCard 
                            key={a.id} 
                            assignment={a} 
                            pulse={a.pulse} 
                            currentUserId={currentUserId} 
                            userStatus={a.myProgress || (title === 'Completed' ? 'finished' : 'not_started')} 
                            variant={viewMode === 'grid' ? 'slim' : 'full'}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                    <div className="p-4 rounded-full bg-white/5 text-white/20 mb-4">
                        <Search size={32} />
                    </div>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No tasks match your search</p>
                </div>
            )}
        </section>
    )
}
