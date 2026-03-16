'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"

// Use the new Gemini_API_Key provided by the user
const genAI = new GoogleGenerativeAI(process.env.Gemini_API_Key || process.env.GOOGLE_AI_API_KEY || "")
const AI_MODEL = "gemma-3-27b-it"
const VISION_MODEL = "gemma-3-27b-it"

export async function extractAssignmentAction(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    try {
        const model = genAI.getGenerativeModel({ 
            model: VISION_MODEL,
            generationConfig: { temperature: 0.1, topP: 0.1 }
        })

        // Convert file to base64
        const buffer = await file.arrayBuffer()
        const base64Data = Buffer.from(buffer).toString('base64')

        const prompt = `Extract assignment JSON: {"course_code": "", "title": "", "description": "", "due_date": "ISO-8601"}. Return ONLY JSON.`

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            }
        ])

        const response = await result.response
        const text = response.text()

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No valid JSON found in response')

        const extractedData = JSON.parse(jsonMatch[0])
        return { success: true, data: extractedData }

    } catch (error: any) {
        console.error('Assistant Extraction Error:', error)
        return { error: 'Extraction failed. Make sure the photo is clear.' }
    }
}

/**
 * Enhances partial form data using gemma-3-27b-it
 */
export async function enhanceFormAction(partialData: Record<string, string>) {
    try {
        const model = genAI.getGenerativeModel({ model: AI_MODEL })

        const context = JSON.stringify(partialData)
        const prompt = `Refine this schedule JSON: ${context}. Suggest titles/descriptions. Return ONLY JSON.`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('AI Assistant failed to refine task.')

        return { success: true, data: JSON.parse(jsonMatch[0]) }
    } catch (error: any) {
        console.error('Assistant Enhance Error:', error)
        return { error: 'Assistant unavailable.' }
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
            id: a.id,
            title: a.title,
            course_code: a.course_code,
            due_date: a.due_date,
            task_type: a.task_type,
            status: a.myProgress
        }))

        const chatContext = history.length > 0 
            ? `HISTORY:\n${history.map(h => `${h.role === 'user' ? 'U' : 'AI'}: ${h.content}`).join('\n')}`
            : ''

        const systemPrompt = `
You are "NotifyAI". Help students manage assignments.
CONTEXT: Class: ${programName}, Time: ${new Date().toLocaleString()}, Data: ${JSON.stringify(contextAssignments)}
${chatContext}
CAPABILITIES: CREATE, UPDATE, DELETE, QUERY.
STRICT: Return ONLY JSON. 
SCHEMA: {"intent": "...", "actionData": {...}, "message": "..."}
`
        const prompt = `${systemPrompt}\n\nUSER: ${message}`
        const result = await model.generateContent(prompt)

        const text = result.response.text()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return { error: "I couldn't process that. Try being more specific." }

        const aiResponse = JSON.parse(jsonMatch[0])
        return { success: true, ...aiResponse }
        
    } catch (error: any) {
        console.error('NotifyAI Error:', error)
        return { error: 'NotifyAI is busy. Try again later.' }
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
            Extract timetable to JSON array: [{"day_of_week":0-6,"start_time":"HH:mm","end_time":"HH:mm","module_name":"Full Name","course_code":"Code/null","venue":"Room/null"}]. 
            Use legend to resolve codes. Include BREAK/LUNCH. Return ONLY JSON. No text.
        `

        const model = genAI.getGenerativeModel({ 
            model: VISION_MODEL,
            generationConfig: { temperature: 0.1, topP: 0.1 }
        })

        // 60-second timeout
        let result: any
        let retries = 1
        
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
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    retries--
                    continue
                }
                throw err
            }
        }

        const text = result.response.text()
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        
        if (!jsonMatch) throw new Error('AI parsing failed. Please try a clearer photo or check your API quota.')

        const extractedData = JSON.parse(jsonMatch[0])
        return { success: true, data: extractedData }

    } catch (error: any) {
        console.error('Timetable Extraction Error:', error)
        if (error.message?.includes('429')) return { error: 'API Limit: Please wait 60s.' }
        return { error: 'Extraction failed: ' + (error.message || 'Unknown error') }
    }
}
