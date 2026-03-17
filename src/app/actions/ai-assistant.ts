'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"

// Use the new Gemini_API_Key provided by the user
const genAI = new GoogleGenerativeAI(process.env.Gemini_API_Key || process.env.GOOGLE_AI_API_KEY || "")
const AI_MODEL = "gemini-2.0-flash-lite"
const VISION_MODEL = "gemini-2.0-flash-lite"

export async function extractAssignmentAction(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    try {
        const model = genAI.getGenerativeModel({ model: VISION_MODEL })
        const buffer = await file.arrayBuffer()
        const base64Data = Buffer.from(buffer).toString('base64')

        const prompt = `Extract JSON: {"course_code": "", "title": "", "description": "", "due_date": "ISO-8601"}. Use ONLY data from image.`

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: file.type } }
        ])

        const text = result.response.text()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No valid JSON found')

        return { success: true, data: JSON.parse(jsonMatch[0]) }

    } catch (error: any) {
        if (error.message?.includes('429')) return { error: 'Google Quota: Wait 30s.' }
        return { error: 'Failed. Use a clearer photo.' }
    }
}

/**
 * Enhances partial form data
 */
export async function enhanceFormAction(partialData: Record<string, string>) {
    try {
        const model = genAI.getGenerativeModel({ model: AI_MODEL })
        const prompt = `Refine JSON: ${JSON.stringify(partialData)}. Return ONLY JSON.`
        const result = await model.generateContent(prompt)
        const jsonMatch = result.response.text().match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('AI failed.')
        return { success: true, data: JSON.parse(jsonMatch[0]) }
    } catch (error: any) {
        return { error: 'Busy.' }
    }
}

/**
 * NotifyAI Chat - handles natural language queries
 */
export async function askNotifyAI(
    message: string, 
    currentAssignments: any[], 
    history: { role: 'user' | 'ai', content: string }[] = [],
    programName: string = "class"
) {
    try {
        const model = genAI.getGenerativeModel({ model: AI_MODEL })
        const prompt = `LOCKED MODE: You are Assistant for ${programName}. Assignments: ${JSON.stringify(currentAssignments)}. History: ${JSON.stringify(history)}. User: ${message}. Return ONLY JSON {"intent": "...", "actionData": {...}, "message": "..."}`
        const result = await model.generateContent(prompt)
        const jsonMatch = result.response.text().match(/\{[\s\S]*\}/)
        if (!jsonMatch) return { error: "Try again." }
        return { success: true, ...JSON.parse(jsonMatch[0]) }
    } catch (error: any) {
        return { error: 'NotifyAI rate-limited.' }
    }
}

/**
 * Extracts weekly schedule from a timetable image
 * Scoped to the user's program context via the prompt
 */
export async function extractTimetableAction(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    try {
        const buffer = await file.arrayBuffer()
        const base64Data = Buffer.from(buffer).toString('base64')

        // Sharp, constraint-driven prompt for better AI precision
        const prompt = `
            TASK: Extract the weekly lecture schedule from this timetable image.
            
            OUTPUT FORMAT: Return a valid JSON array of objects.
            Each object MUST have:
            - "day_of_week": integer (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
            - "start_time": string "HH:mm" (24h format)
            - "end_time": string "HH:mm" (24h format)
            - "module_name": string (Full name of the subject/module)
            - "course_code": string or null (e.g., "CS101")
            - "venue": string or null (Room number or hall name)
            - "lecturer": string or null (Name of the lecturer)

            RULES:
            1. If a value is unclear, use null.
            2. Do NOT include any text outside the JSON array.
            3. Ensure 24-hour time format (e.g., 08:30 instead of 8:30 AM).
        `

        const model = genAI.getGenerativeModel({
            model: VISION_MODEL,
            generationConfig: { 
                temperature: 0.1,
                topP: 0.8,
                topK: 40
            }
        })

        const result = await Promise.race([
            model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType: file.type } }
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timed Out')), 45000))
        ]) as any

        const text = result.response.text()
        
        // Robust JSON extraction: Find the first [ and the last ]
        const startBracket = text.indexOf('[')
        const endBracket = text.lastIndexOf(']')
        
        if (startBracket === -1 || endBracket === -1) {
            console.error('Invalid AI Output:', text)
            throw new Error('No schedule grid detected. Please try a clearer or closer photo.')
        }

        const jsonStr = text.substring(startBracket, endBracket + 1)
        const data = JSON.parse(jsonStr)

        if (!Array.isArray(data)) throw new Error('Invalid format: Expected an array of lectures.')

        return { success: true, data }

    } catch (error: any) {
        console.error('Timetable Extraction Error:', error)
        if (error.message?.includes('429')) return { error: 'Google Quota Limit: Please wait 60 seconds.' }
        return { error: 'Extraction failed: ' + (error.message || 'Check connection.') }
    }
}
