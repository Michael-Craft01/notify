'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"

// Use the new Gemini_API_Key provided by the user
const genAI = new GoogleGenerativeAI(process.env.Gemini_API_Key || process.env.GOOGLE_AI_API_KEY || "")
const AI_MODEL = "gemini-2.0-flash"
const VISION_MODEL = "gemini-2.0-flash"

export async function extractAssignmentAction(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    try {
        const model = genAI.getGenerativeModel({ 
            model: VISION_MODEL,
            generationConfig: { temperature: 0.1 }
        })

        const buffer = await file.arrayBuffer()
        const base64Data = Buffer.from(buffer).toString('base64')

        const prompt = `Extract assignment JSON: {"course_code": "", "title": "", "description": "", "due_date": "ISO-8601"}. Return ONLY JSON.`

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: file.type } }
        ])

        const text = result.response.text()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No valid JSON found')

        return { success: true, data: JSON.parse(jsonMatch[0]) }

    } catch (error: any) {
        if (error.message?.includes('429')) return { error: 'Quota hit. Wait 30s.' }
        return { error: 'Extraction failed. Try a clearer photo.' }
    }
}

/**
 * Enhances partial form data using gemini-2.0-flash
 */
export async function enhanceFormAction(partialData: Record<string, string>) {
    try {
        const model = genAI.getGenerativeModel({ model: AI_MODEL })
        const context = JSON.stringify(partialData)
        const prompt = `Refine this schedule JSON: ${context}. Return ONLY updated JSON.`

        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('AI failed to refine.')

        return { success: true, data: JSON.parse(jsonMatch[0]) }
    } catch (error: any) {
        return { error: 'Assistant busy.' }
    }
}

/**
 * NotifyAI Chat - Handles natural language database commands with conversation history
 */
export async function askNotifyAI(
    message: string, 
    currentAssignments: any[], 
    history: { role: 'user' | 'ai', content: string }[] = [],
    programName: string = "this class"
) {
    try {
        const model = genAI.getGenerativeModel({ model: AI_MODEL })
        const contextAssignments = currentAssignments.map(a => ({
            id: a.id, title: a.title, code: a.course_code, due: a.due_date, type: a.task_type, status: a.myProgress
        }))

        const chatContext = history.length > 0 
            ? `HISTORY:\n${history.map(h => `${h.role === 'user' ? 'U' : 'AI'}: ${h.content}`).join('\n')}`
            : ''

        const systemPrompt = `You are "NotifyAI". Class: ${programName}. Assignments: ${JSON.stringify(contextAssignments)}. ${chatContext} Return ONLY JSON {"intent": "...", "actionData": {...}, "message": "..."}`
        const prompt = `${systemPrompt}\n\nUSER: ${message}`
        const result = await model.generateContent(prompt)

        const text = result.response.text()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return { error: "I couldn't process that. Try again." }

        return { success: true, ...JSON.parse(jsonMatch[0]) }
    } catch (error: any) {
        return { error: 'NotifyAI Chat is rate-limited. Wait a minute!' }
    }
}

/**
 * Extracts weekly schedule from a timetable image/PDF
 */
export async function extractTimetableAction(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    try {
        const buffer = await file.arrayBuffer()
        const base64Data = Buffer.from(buffer).toString('base64')

        const timetablePrompt = `
            Extract timetable to JSON array. Schema: [{"day_of_week":0-6 (0=Sun),"start_time":"HH:mm","end_time":"HH:mm","module_name":"Full Title","course_code":"Code/null","venue":"Room/null"}]. 
            Resolve codes using legend. Include BREAK/LUNCH. Return ONLY JSON.
        `

        const model = genAI.getGenerativeModel({ 
            model: VISION_MODEL,
            generationConfig: { temperature: 0.1 }
        })

        let result: any
        let retries = 2
        
        while (retries >= 0) {
            try {
                result = await Promise.race([
                    model.generateContent([
                        timetablePrompt,
                        { inlineData: { data: base64Data, mimeType: file.type } }
                    ]),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timed Out')), 60000))
                ]) as any
                break 
            } catch (err: any) {
                if (err.message?.includes('429') && retries > 0) {
                    console.log(`[Rate Limit] Retrying in 3s... (${retries} left)`)
                    await new Promise(resolve => setTimeout(resolve, 3000))
                    retries--
                    continue
                }
                throw err
            }
        }

        const text = result.response.text()
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) throw new Error('AI could not format the grid. Please try a clearer, closer photo.')

        return { success: true, data: JSON.parse(jsonMatch[0]) }

    } catch (error: any) {
        console.error('Timetable Extraction Error:', error)
        if (error.message?.includes('429')) return { error: 'Google Rate Limit: Please wait 60 seconds and try again.' }
        return { error: 'Extraction failed: ' + (error.message || 'Check your internet or API key.') }
    }
}
