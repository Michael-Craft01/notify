'use client'

import { useState, useRef, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
    X, Loader2, Sparkles, Upload, 
    Calendar, Clock, BookOpen, MapPin, 
    CheckCircle2, AlertTriangle, ChevronRight,
    Trash2
} from 'lucide-react'
import { extractTimetableAction } from '@/app/actions/ai-assistant'
import { saveExtractedSchedule } from '@/app/actions/schedules'

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

async function compressImage(file: File): Promise<File> {
    const img = document.createElement('img')
    img.src = URL.createObjectURL(file)
    await new Promise(resolve => img.onload = resolve)
    
    const canvas = document.createElement('canvas')
    const MAX_WIDTH = 440
    const scale = Math.min(1, MAX_WIDTH / img.width)
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
    
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.6))
    if (!blob) return file
    return new File([blob], file.name, { type: 'image/jpeg' })
}

export default function TimetableUploadModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isExtracting, setIsExtracting] = useState(false)
    const [extractionMode, setExtractionMode] = useState<'image' | 'paste'>('image')
    const [pastedText, setPastedText] = useState('')
    const [lectures, setLectures] = useState<any[]>([])
    const [error, setError] = useState<any>(null)
    const [isSaving, startSaving] = useTransition()
    const [success, setSuccess] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handlePaste = () => {
        if (!pastedText.trim()) return
        setError(null)
        
        const lines = pastedText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        let currentDay = 1 // Default Monday
        const newLectures: any[] = []

        const daysMap: Record<string, number> = {
            'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0,
            'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 0
        }

        const timeRegex = /(\d{1,2}[:.]\d{2})\s*(?:-|to)\s*(\d{1,2}[:.]\d{2})/i

        lines.forEach(line => {
            const lowerLine = line.toLowerCase()
            
            // Check for Day Marker
            for (const [dayName, dayIdx] of Object.entries(daysMap)) {
                if (lowerLine === dayName || lowerLine.startsWith(dayName + ' ')) {
                    currentDay = dayIdx
                    return
                }
            }

            // Check for Class Entry (Time + Module)
            const timeMatch = line.match(timeRegex)
            if (timeMatch) {
                const startTime = timeMatch[1].replace('.', ':')
                const endTime = timeMatch[2].replace('.', ':')
                
                const moduleInfo = line.replace(timeMatch[0], '').trim()
                const codeMatch = moduleInfo.match(/[A-Z]{2,4}\s*\d{3,4}/i)
                const courseCode = codeMatch ? codeMatch[0] : null
                const moduleName = moduleInfo.replace(courseCode || '', '').trim() || "Untitled Module"

                newLectures.push({
                    day_of_week: currentDay,
                    start_time: startTime.padStart(5, '0'),
                    end_time: endTime.padStart(5, '0'),
                    module_name: moduleName,
                    course_code: courseCode,
                    venue: "Campus"
                })
            }
        })

        if (newLectures.length > 0) {
            setLectures(newLectures)
            setPastedText('')
        } else {
            setError("Could not detect any classes. Try pasting in 'Time - Module' format (e.g. 08:00-10:00 Maths)")
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsExtracting(true)
        setError(null)
        
        let fileToUpload = file
        if (file.type.startsWith('image/')) {
            try {
                fileToUpload = await compressImage(file)
            } catch (e) {
                console.error("Compression failed", e)
            }
        }

        const fd = new FormData()
        fd.append('file', fileToUpload)

        const result = await extractTimetableAction(fd)
        setIsExtracting(false)

        if (result.success && result.data) {
            setLectures(result.data)
        } else {
            setError(result)
        }
    }

    const removeLecture = (index: number) => {
        setLectures(prev => prev.filter((_, i) => i !== index))
    }

    const handleSave = () => {
        if (lectures.length === 0) return
        startSaving(async () => {
            const result = await saveExtractedSchedule(lectures)
            if (result.success) {
                setSuccess(true)
                setTimeout(() => {
                    setIsOpen(false)
                    setLectures([])
                    setSuccess(false)
                }, 2000)
            } else {
                setError(result.error || "Failed to save schedule.")
            }
        })
    }

    if (!mounted) return null

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
                <Sparkles size={15} className="text-orange" />
                <span>AI Eye</span>
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[400] animate-fade-in flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setIsOpen(false)} />
                    
                    <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-scale-in">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-orange" />
                                    The Warden's Eye
                                </h3>
                                <p className="text-xs text-white/40 mt-0.5">Upload a photo or paste text to automate reminders</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Tabs */}
                        {lectures.length === 0 && (
                            <div className="flex px-6 pt-4 gap-2">
                                <button 
                                    onClick={() => setExtractionMode('image')}
                                    className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg border transition-all ${extractionMode === 'image' ? 'bg-orange/10 border-orange/20 text-orange' : 'bg-white/5 border-white/5 text-white/40'}`}
                                >
                                    Scan Photo
                                </button>
                                <button 
                                    onClick={() => setExtractionMode('paste')}
                                    className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg border transition-all ${extractionMode === 'paste' ? 'bg-orange/10 border-orange/20 text-orange' : 'bg-white/5 border-white/5 text-white/40'}`}
                                >
                                    Smart Paste
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {lectures.length === 0 ? (
                                <div className="flex flex-col gap-4">
                                    {extractionMode === 'image' ? (
                                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                                            {isExtracting ? (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="relative">
                                                        <div className="h-16 w-16 rounded-2xl border-2 border-orange/20 flex items-center justify-center">
                                                            <Loader2 size={32} className="text-orange animate-spin" />
                                                        </div>
                                                        <div className="absolute -inset-4 bg-orange/10 blur-2xl animate-pulse" />
                                                    </div>
                                                    <p className="text-sm font-bold text-white uppercase tracking-widest animate-pulse">Flash Scanning...</p>
                                                    <p className="text-xs text-white/40 text-center">Identifying your lectures with high precision...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="h-16 w-16 rounded-2xl bg-orange/10 flex items-center justify-center mb-4">
                                                        <Upload size={32} className="text-orange" />
                                                    </div>
                                                    <h4 className="text-white font-bold mb-1">Scan Timetable Photo</h4>
                                                    <p className="text-xs text-white/30 mb-6 font-medium font-inter">Instant high-accuracy OCR</p>
                                                    <label className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black cursor-pointer uppercase tracking-widest hover:scale-[1.05] transition-transform">
                                                        <span>Select Photo</span>
                                                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-fade-up">
                                            <div className="p-4 rounded-xl bg-orange/5 border border-orange/10">
                                                <p className="text-[11px] text-orange/80 leading-relaxed font-inter font-medium">
                                                    <strong>Manual Entry:</strong> Paste text from your portal if you don't have a photo.
                                                </p>
                                            </div>
                                            <textarea 
                                                value={pastedText}
                                                onChange={(e) => setPastedText(e.target.value)}
                                                placeholder="Paste your timetable text here..."
                                                className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 text-[13px] text-white focus:outline-none focus:border-orange/30 transition-colors resize-none font-inter"
                                            />
                                            <button 
                                                onClick={handlePaste}
                                                disabled={!pastedText.trim()}
                                                className="w-full py-3 bg-orange text-black font-black uppercase tracking-widest rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-orange/10"
                                            >
                                                Extract Instantly
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : success ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center animate-fade-up">
                                    <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                                        <CheckCircle2 size={40} className="text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Schedule Synced!</h3>
                                    <p className="text-white/40 mt-2">The Warden is now tracking your lectures.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-up">
                                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-white/30 px-2">
                                        <span>Detected Lectures ({lectures.length})</span>
                                        <button onClick={() => setLectures([])} className="hover:text-red-400 transition-colors">Reset</button>
                                    </div>
                                    
                                    <div className="grid gap-3">
                                        {lectures.map((lecture, i) => (
                                            <div key={i} className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/5 font-black shrink-0">
                                                    <span className="text-[10px] text-white/30 uppercase">{DAYS[lecture.day_of_week]?.slice(0,3)}</span>
                                                    <span className="text-sm text-white">{lecture.start_time?.split(':')[0]}</span>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="text-[13px] font-bold text-white truncate">{lecture.module_name}</h5>
                                                        {lecture.course_code && (
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-orange/10 text-orange uppercase">{lecture.course_code}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="flex items-center gap-1 text-[11px] text-white/40">
                                                            <Clock size={10} /> {lecture.start_time} - {lecture.end_time}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[11px] text-white/40">
                                                            <MapPin size={10} /> {lecture.venue || "TBA"}
                                                        </span>
                                                        {lecture.lecturer && (
                                                            <span className="flex items-center gap-1 text-[11px] text-white/40 italic">
                                                                • {lecture.lecturer}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => removeLecture(i)}
                                                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-white/10 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center gap-3 text-red-500 text-xs font-medium">
                                    <AlertTriangle size={16} />
                                    {typeof error === 'string' ? error : (error.error || "Failed to parse timetable.")}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {lectures.length > 0 && !success && (
                            <div className="px-6 py-5 border-t border-white/10 flex items-center justify-between bg-white/[0.01]">
                                <p className="text-[11px] text-white/30 font-medium">Please review the detected data before saving.</p>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="btn-primary flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange/20"
                                >
                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Schedule'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
