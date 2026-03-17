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
 */
export async function extractTimetableAction(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    try {
        const buffer = await file.arrayBuffer()
        const base64Data = Buffer.from(buffer).toString('base64')

        const prompt = `Extract timetable image to JSON array: [{"day_of_week":0-6,"start_time":"HH:mm","end_time":"HH:mm","module_name":"Text","course_code":"Code/null","venue":"Room/null"}]. Return ONLY JSON.`

        const model = genAI.getGenerativeModel({
            model: VISION_MODEL,
            generationConfig: { temperature: 0.1 }
        })

        const result = await Promise.race([
            model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType: file.type } }
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timed Out')), 45000))
        ]) as any

        const text = result.response.text()
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) throw new Error('Could not parse grid. Use a closer photo.')

        return { success: true, data: JSON.parse(jsonMatch[0]) }

    } catch (error: any) {
        console.error('Timetable Extraction Error:', error)
        if (error.message?.includes('429')) return { error: 'Google Quota Limit: Please wait 60 seconds.' }
        return { error: 'Extraction failed: ' + (error.message || 'Check connection.') }
    }
}
