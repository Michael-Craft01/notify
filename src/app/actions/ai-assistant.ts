'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"

// Use the new Gemini_API_Key provided by the user
const genAI = new GoogleGenerativeAI(process.env.Gemini_API_Key || process.env.GOOGLE_AI_API_KEY || "")
const AI_MODEL = "gemma-3-27b-it"
const VISION_MODEL = "gemini-1.5-flash"

export async function extractAssignmentAction(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    try {
        const model = genAI.getGenerativeModel({ model: VISION_MODEL })

        // Convert file to base64
        const buffer = await file.arrayBuffer()
        const base64Data = Buffer.from(buffer).toString('base64')

        const prompt = `
      Extract assignment details from this ${file.type.startsWith('image') ? 'image' : 'document'}.
      Return ONLY a JSON object with these keys:
      - course_code (e.g., CSC 301)
      - title (short, descriptive)
      - description (brief summary)
      - due_date (ISO 8601 string, guess the year if missing based on current time: ${new Date().toISOString()})
      
      If you cannot find a value, use null.
      Strictly follow the JSON format, no other text.
    `

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
        return { error: error.message || 'Failed to extract data from document.' }
    }
}

/**
 * Enhances partial form data using gemma-3-27b-it
 */
export async function enhanceFormAction(partialData: Record<string, string>) {
    try {
        const model = genAI.getGenerativeModel({ model: AI_MODEL })

        const context = JSON.stringify(partialData)
        const prompt = `
            You are the "Notify AI Assistant", a professional productivity tool for university students.
            Given these partial schedule details: ${context}
            
            Improve and complete the missing details. 
            - If it's a course code like "CSC101", suggest a professional full title and a descriptive summary.
            - Provide a plausible deadline if missing, aligned with a standard academic schedule.
            - Ensure the tone is professional, technical, and premium SaaS-style.
            
            Return ONLY a JSON object with keys like 'title', 'course_code', 'description', 'due_date'.
            Only include fields that you have improved or completed.
            No conversational text.
        `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('AI Assistant failed to refine task.')

        return { success: true, data: JSON.parse(jsonMatch[0]) }
    } catch (error: any) {
        console.error('Assistant Enhance Error:', error)
        return { error: 'Assistant unavailable at this moment.' }
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
            ? `CONVERSATION HISTORY:\n${history.map(h => `${h.role === 'user' ? 'User' : 'NotifyAI'}: ${h.content}`).join('\n')}`
            : ''

        const systemPrompt = `
You are "NotifyAI", the intelligent backbone of the Notify productivity app. 
Your goal is to help students manage their assignments using natural language.

CURRENT CONTEXT:
- Academic Program: ${programName}
- Current Time: ${new Date().toLocaleString()}
- Assignments in View: ${JSON.stringify(contextAssignments)}

${chatContext}

CAPABILITIES:
1. CREATE: Add new assignments/quizzes/tests.
2. UPDATE: Change details or status (e.g., "mark MP201 as done").
3. DELETE: Remove tasks.
4. QUERY: Filter, find, or analyze tasks.

STRICT INSTRUCTIONS:
- You are strictly operating within the context of "${programName}". 
- All tasks you create or modify belong only to this group.
- You must return a SINGLE JSON object. No other text.
- For CREATE/UPDATE:
    - course_code: Uppercase (e.g., "CSC301")
    - title: Clear, concise title
    - due_date: MUST be a valid ISO-8601 string.
    - task_type: MUST be exactly one of: 'assignment', 'quiz', 'online_test', 'physical_test'.
- Use the CONVERSATION HISTORY to resolve pronouns ("it", "that") and follow-ups ("yes", "do it").
- If the user says "add a quiz", set task_type to 'quiz'.

RESPONSE SCHEMA:
{
    "intent": "create" | "update" | "delete" | "query" | "chat",
    "actionData": {
        "id": "UUID (only for update/delete)",
        "course_code": "...",
        "title": "...",
        "description": "...",
        "due_date": "ISO-TIMESTAMP",
        "task_type": "assignment" | "quiz" | "online_test" | "physical_test"
    },
    "message": "A professional and friendly response explaining the action."
}

Ensure the message confirms what was done (e.g., "I've added the quiz for you.").
`
        const prompt = `${systemPrompt}\n\nUSER REQUEST: ${message}`
        const result = await model.generateContent(prompt)

        const text = result.response.text()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return { error: "I couldn't process that request. Try being more specific." }


        const aiResponse = JSON.parse(jsonMatch[0])
        return { success: true, ...aiResponse }
        
    } catch (error: any) {
        console.error('NotifyAI Error:', error)
        return { error: 'NotifyAI is having a moment. Please try again later.' }
    }
}

/**
 * Extracts weekly schedule from a timetable image/PDF
 */
export async function extractTimetableAction(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    try {
        const model = genAI.getGenerativeModel({ model: VISION_MODEL })

        const buffer = await file.arrayBuffer()
        const base64Data = Buffer.from(buffer).toString('base64')

        const prompt = `
            You are "Notify AI Eye", a specialized OCR tool for university timetables.
            Extract the weekly lecture schedule from this ${file.type.startsWith('image') ? 'image' : 'document'}.
            
            CRITICAL: Use the legend (CODE/COURSE/LECTURER) usually found at the bottom to resolve course codes (e.g., "ICS2205") into their "Full Name of Module" (e.g., "Applied Statistics").
            
            Return ONLY a JSON array of objects, where each object represents a single entry (lecture, BREAK, or LUNCH):
            - day_of_week: Integer (1 for Monday, 2 for Tuesday, 3 for Wednesday, 4 for Thursday, 5 for Friday, 6 for Saturday, 0 for Sunday)
            - start_time: "HH:mm" (24h format)
            - end_time: "HH:mm" (24h format)
            - module_name: "Full Name" (Use "BREAK" or "LUNCH" if that's the entry)
            - course_code: "Course Code" (e.g., "ICS2205", or null for breaks)
            - venue: "Room/Hall Name" (or null for breaks)
            
            If a lecture spans multiple hours, capture the full duration. Include "BREAK" and "LUNCH" rows as entries.
            Strictly follow this structure. Return ONLY the JSON. No other text.
        `

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            }
        ])

        const text = result.response.text()
        
        // Robust JSON cleaning
        const cleanJson = (str: string) => {
            let cleared = str.trim()
            if (cleared.startsWith('```')) cleared = cleared.split('\n').slice(1, -1).join('\n')
            return cleared.trim()
        }

        const processedText = cleanJson(text)
        const jsonMatch = processedText.match(/\[[\s\S]*\]/)
        
        if (!jsonMatch) {
            console.error('[AI EYE] No array found. Raw:', text)
            return { 
                error: 'AI failed to format timetable correctly.', 
                debug: text.slice(0, 500) 
            }
        }

        try {
            const extractedData = JSON.parse(jsonMatch[0])
            return { success: true, data: extractedData }
        } catch (e) {
            console.error('[AI EYE] JSON Parse Error:', e)
            return { 
                error: 'Failed to parse AI response.', 
                debug: jsonMatch[0].slice(0, 500) 
            }
        }

    } catch (error: any) {
        console.error('Timetable Extraction Error:', error)
        return { error: 'Extraction failed: ' + (error.message || 'Unknown error') }
    }
}
