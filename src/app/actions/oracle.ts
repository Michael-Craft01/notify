'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"

// Use the new Gemini_API_Key provided by the user
const genAI = new GoogleGenerativeAI(process.env.Gemini_API_Key || process.env.GOOGLE_AI_API_KEY || "")
// Requested model: gemma-3-27b-it
const AI_MODEL = "gemma-3-27b-it"

export async function extractAssignmentAction(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) // Keeping extraction on Flash for speed/multimodal

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
        console.error('Oracle Extraction Error:', error)
        return { error: error.message || 'Failed to extract data from intel.' }
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
        if (!jsonMatch) throw new Error('Oracle failed to refine intel.')

        return { success: true, data: JSON.parse(jsonMatch[0]) }
    } catch (error: any) {
        console.error('Oracle Enhance Error:', error)
        return { error: 'Oracle unavailable at this moment.' }
    }
}
