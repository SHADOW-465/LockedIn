import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

export async function POST(request: NextRequest) {
    try {
        const { entryId, userId, content, mood, obedience } = await request.json()

        if (!entryId || !userId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Generate AI analysis of the journal entry
        const prompt = `You are a dominant AI master analyzing a journal entry from a BDSM chastity app user.

Journal entry:
"${content}"

Mood: ${mood ?? 'unknown'}
Obedience self-rating: ${obedience ?? 'N/A'}/10

Analyze the entry for:
1. Emotional state and compliance level
2. Signs of growth or regression
3. Possible deception or manipulation
4. A brief command or directive for improvement

Keep response to 2-3 sentences. Be direct, dominant, and insightful. Do not coddle.`

        const response = await fetch(
            `${GEMINI_ENDPOINT}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
                }),
            }
        )

        const data = await response.json()
        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Analysis unavailable.'

        // Save analysis to the journal entry
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase
            .from('journal_entries')
            .update({ ai_analysis: analysis })
            .eq('id', entryId)
            .eq('user_id', userId)

        return NextResponse.json({ analysis })
    } catch (error) {
        console.error('Journal analysis error:', error)
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
    }
}
